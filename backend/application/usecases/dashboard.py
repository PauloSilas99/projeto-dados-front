from __future__ import annotations

import csv
from collections import Counter, defaultdict
from dataclasses import asdict
from pathlib import Path
from typing import Any, Dict, Iterable, List

from backend.domain.services.pdf_engine import PdfEngine
from typing import Iterable
from backend.domain.services.pdf_engine import CsvManagerPort

from backend.application.dtos import (
    DashboardOverviewDTO,
    TotaisDTO,
    CertificadoPorMesDTO,
    CertificadoPorCidadeDTO,
    CertificadoPorPragaDTO,
    ClasseQuimicaDTO,
    MetodoAplicacaoDTO,
    ValorFinanceiroDTO,
    ProdutoPorNomeDTO,
)


class GetDashboardOverviewUseCase:
    def __init__(self, pdf_engine: PdfEngine):
        self.pdf_engine = pdf_engine
        self.csv_manager: CsvManagerPort = pdf_engine.get_csv_manager()

    def execute(self) -> DashboardOverviewDTO:
        certificados = self.pdf_engine.listar_certificados()
        produtos = list(self._iter_csv_rows(self.csv_manager.produtos_path))
        metodos = list(self._iter_csv_rows(self.csv_manager.metodos_path))

        return DashboardOverviewDTO(
            totals=self._build_totals(certificados, produtos, metodos),
            certificadosPorMes=self._group_certificados_por_mes(certificados),
            certificadosPorCidade=self._group_by_attr(certificados, "cidade"),
            certificadosPorPraga=self._group_by_praga(certificados),
            classesQuimicas=self._group_csv_column(produtos, "classe_quimica", "classe"),
            metodosAplicacao=self._group_csv_column(metodos, "metodo", "metodo"),
            valorFinanceiro=self._build_finance_summary(certificados),
            produtosPorNome=self.group_produtos_por_nome(),
        )

    def _build_totals(
        self,
        certificados: List[Any],
        produtos: List[Dict[str, str]],
        metodos: List[Dict[str, str]],
    ) -> TotaisDTO:
        return TotaisDTO(
            certificados=len(certificados),
            produtos=len(produtos),
            metodos=len(metodos),
        )

    def _group_certificados_por_mes(self, certificados: Iterable[Any]) -> List[CertificadoPorMesDTO]:
        contador: Dict[str, int] = defaultdict(int)
        for certificado in certificados:
            chave = certificado.data_execucao.strftime("%Y-%m")
            contador[chave] += 1
        return [CertificadoPorMesDTO(mes=mes, quantidade=qtd) for mes, qtd in sorted(contador.items(), key=lambda x: x[1], reverse=True)]

    def _group_by_attr(self, certificados: Iterable[Any], attr: str) -> List[CertificadoPorCidadeDTO]:
        contador: Dict[str, int] = defaultdict(int)
        for certificado in certificados:
            valor = getattr(certificado, attr, None)
            if valor:
                contador[str(valor)] += 1
        return [CertificadoPorCidadeDTO(cidade=cidade, quantidade=qtd) for cidade, qtd in sorted(contador.items(), key=lambda x: x[1], reverse=True)]

    def _group_by_praga(self, certificados: Iterable[Any]) -> List[CertificadoPorPragaDTO]:
        contador: Dict[str, int] = defaultdict(int)
        for certificado in certificados:
            pragas = certificado.pragas_tratadas or ""
            for praga in [part.strip() for part in pragas.split(",") if part.strip()]:
                contador[praga] += 1
        return [CertificadoPorPragaDTO(praga=praga, quantidade=qtd) for praga, qtd in sorted(contador.items(), key=lambda x: x[1], reverse=True)]

    def _group_csv_column(
        self, rows: Iterable[Dict[str, str]], column: str, key_name: str
    ) -> List[ClasseQuimicaDTO] | List[MetodoAplicacaoDTO]:
        contador = Counter()
        for row in rows:
            valor = row.get(column)
            if valor:
                contador[valor.strip()] += 1
        if key_name == "classe":
            return [ClasseQuimicaDTO(classe=k, quantidade=v) for k, v in contador.most_common()]
        else:
            return [MetodoAplicacaoDTO(metodo=k, quantidade=v) for k, v in contador.most_common()]

    def group_produtos_por_nome(self) -> List[ProdutoPorNomeDTO]:
        rows = list(self._iter_csv_rows(self.csv_manager.produtos_path))
        contador = Counter()
        for row in rows:
            nome = (row.get("produto") or row.get("nome_produto") or "").strip()
            if nome:
                contador[nome] += 1
        return [ProdutoPorNomeDTO(produto=k, quantidade=v) for k, v in contador.most_common()]

    def _build_finance_summary(self, certificados: Iterable[Any]) -> ValorFinanceiroDTO:
        valores: List[float] = []
        for certificado in certificados:
            valor = self._parse_valor(certificado.valor)
            if valor is not None:
                valores.append(valor)
        total = sum(valores)
        media = total / len(valores) if valores else 0.0
        return ValorFinanceiroDTO(
            total=round(total, 2),
            media=round(media, 2),
        )

    @staticmethod
    def _iter_csv_rows(path: Path) -> Iterable[Dict[str, str]]:
        if not path.exists():
            return []
        with path.open("r", newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            return list(reader)

    @staticmethod
    def _dict_to_sorted_list(data: Dict[str, int], key_name: str) -> List[Dict[str, Any]]:
        return [
            {key_name: key, "quantidade": quantidade}
            for key, quantidade in sorted(data.items(), key=lambda item: item[1], reverse=True)
        ]

    @staticmethod
    def _parse_valor(valor: str | None) -> float | None:
        if not valor:
            return None
        normalizado = (
            valor.replace("R$", "")
            .replace(".", "")
            .replace(" ", "")
            .replace(",", ".")
        )
        try:
            return float(normalizado)
        except ValueError:
            return None


class GetCertificateAnalyticsUseCase:
    def __init__(self, pdf_engine: PdfEngine):
        self.pdf_engine = pdf_engine
        self.csv_manager: CsvManager = pdf_engine.get_csv_manager()

    def execute(self, numero_certificado: str) -> Dict[str, Any] | None:
        bundle = self.csv_manager.get_bundle_by_numero(numero_certificado)
        if not bundle:
            return None
        return self._bundle_to_chart_data(bundle)

    def _bundle_to_chart_data(self, bundle: CertificadoBundle) -> Dict[str, Any]:
        certificado = bundle.certificado
        produtos = bundle.produtos
        metodos = bundle.metodos

        produtos_por_classe = Counter(produto.classe_quimica or "Sem classe" for produto in produtos)
        metodos_por_tipo = Counter(metodo.metodo or "Sem descrição" for metodo in metodos)

        return {
            "certificado": certificado.to_dict(),
            "produtos": [asdict(produto) for produto in produtos],
            "metodos": [asdict(metodo) for metodo in metodos],
            "distribuicaoProdutos": [
                {"classe": classe, "quantidade": quantidade}
                for classe, quantidade in produtos_por_classe.most_common()
            ],
            "distribuicaoMetodos": [
                {"metodo": metodo, "quantidade": quantidade}
                for metodo, quantidade in metodos_por_tipo.most_common()
            ],
        }
