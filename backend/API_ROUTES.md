# API Routes Documentation

Base URL: `http://localhost:8000`

## 📋 Certificados

### Listar Certificados
```http
GET /certificados
```

**Query Parameters:**
- `id` (optional): Filter by certificate ID
- `bairro` (optional): Filter by neighborhood
- `cidade` (optional): Filter by city
- `min_valor` (optional): Minimum value filter
- `max_valor` (optional): Maximum value filter
- `limit` (optional, default: 100): Number of results
- `offset` (optional, default: 0): Pagination offset

**Response:**
```json
{
  "sucesso": true,
  "data": [
    {
      "certificado": {
        "id": "abc123",
        "numero_certificado": "240/25-KJ",
        "razao_social": "Empresa XYZ",
        "cidade": "Imperatriz-MA",
        "valor": "R$ 1.500,00",
        "data_execucao": "2025-09-02T00:00:00"
      },
      "urls": {
        "detalhes": "/certificados/abc123",
        "pdf": "/certificados/abc123/pdf",
        "planilha": "/certificados/abc123/planilha"
      },
      "arquivos": {
        "pdf": "/app/outputs/pdfs/240_25-KJ.pdf",
        "planilha": "/app/outputs/planilhas/consolidado.xlsx"
      }
    }
  ],
  "message": "Lista de certificados"
}
```

---

### Criar Certificado Manual
```http
POST /certificados/manual
```

**Request Body:**
```json
{
  "numero_certificado": "240/25-KJ",
  "numero_licenca": "080/2024",
  "razao_social": "Empresa ABC",
  "nome_fantasia": "ABC Comércio",
  "cnpj": "12.345.678/0001-99",
  "endereco": "Rua Example, 123",
  "bairro": "Centro",
  "cidade": "São Paulo",
  "estado": "SP",
  "data_execucao": "2025-01-15",
  "data_validade": "2025-04-15",
  "pragas_tratadas": "insetos, roedores",
  "valor": "R$ 1.500,00",
  "produtos": [
    {
      "produto": "Produto A",
      "dosagem_concentracao": "10ml/L",
      "classe_quimica": "Piretroide"
    }
  ],
  "metodos": [
    {
      "metodo": "Pulverização"
    }
  ]
}
```

**Response:**
```json
{
  "sucesso": true,
  "data": {
    "certificado": { /* ... */ },
    "produtos": [ /* ... */ ],
    "metodos": [ /* ... */ ],
    "arquivos": {
      "pdf": "/app/outputs/pdfs/240_25-KJ.pdf",
      "planilha": "/app/outputs/planilhas/consolidado.xlsx",
      "urls": {
        "detalhes": "/certificados/abc123",
        "pdf": "/certificados/abc123/pdf",
        "planilha": "/certificados/abc123/planilha"
      }
    }
  },
  "message": "Certificado criado com sucesso"
}
```

---

### Upload Excel
```http
POST /certificados/upload-excel
```

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (Excel file)

**Response:**
```json
{
  "sucesso": true,
  "data": {
    "numero_certificado": "240/25-KJ",
    "planilha": "/app/outputs/planilhas/consolidado.xlsx",
    "pdf": "/app/outputs/pdfs/240_25-KJ.pdf",
    "cert_id": "abc123",
    "urls": {
      "detalhes": "/certificados/abc123",
      "pdf": "/certificados/abc123/pdf",
      "planilha": "/certificados/abc123/planilha"
    }
  },
  "message": "Upload processado com sucesso"
}
```

---

### Obter Certificado por ID
```http
GET /certificados/{id}
```

**Response:**
```json
{
  "sucesso": true,
  "data": {
    "certificado": {
      "id": "abc123",
      "numero_certificado": "240/25-KJ",
      "razao_social": "Empresa XYZ",
      /* ... */
    },
    "produtos": [ /* ... */ ],
    "metodos": [ /* ... */ ],
    "arquivos": {
      "pdf": "/app/outputs/pdfs/240_25-KJ.pdf",
      "planilha": "/app/outputs/planilhas/consolidado.xlsx",
      "urls": { /* ... */ }
    }
  },
  "message": "Certificado recuperado com sucesso"
}
```

---

### Download PDF
```http
GET /certificados/{id}/pdf
```

**Response:** Binary PDF file

---

### Download Planilha
```http
GET /certificados/{id}/planilha
```

**Response:** Binary Excel file

---

### Download Planilha Consolidada
```http
GET /certificados/planilha-consolidada
```

**Response:** Binary Excel file with all certificates

---

## 📊 Dashboard

### Overview
```http
GET /dashboard/overview
```

**Response:**
```json
{
  "sucesso": true,
  "data": {
    "totals": {
      "certificados": 150,
      "produtos": 45,
      "metodos": 12
    },
    "certificadosPorMes": [
      { "mes": "2025-01", "quantidade": 25 }
    ],
    "certificadosPorCidade": [
      { "cidade": "São Paulo", "quantidade": 50 }
    ],
    "certificadosPorPraga": [
      { "praga": "insetos", "quantidade": 80 }
    ],
    "classesQuimicas": [
      { "classe": "Piretroide", "quantidade": 30 }
    ],
    "metodosAplicacao": [
      { "metodo": "Pulverização", "quantidade": 60 }
    ],
    "valorFinanceiro": {
      "total": 150000.00,
      "media": 1000.00
    }
  },
  "message": "Dados do dashboard recuperados com sucesso"
}
```

---

### Analytics por Certificado
```http
GET /dashboard/certificado?id={certificado_id}
```

**Response:**
```json
{
  "sucesso": true,
  "data": {
    "certificado": { /* ... */ },
    "produtos": [ /* ... */ ],
    "metodos": [ /* ... */ ],
    "distribuicaoProdutos": [
      { "classe": "Piretroide", "quantidade": 3 }
    ],
    "distribuicaoMetodos": [
      { "metodo": "Pulverização", "quantidade": 2 }
    ]
  },
  "message": "Analytics do certificado recuperado com sucesso"
}
```

---

### Mapa de Calor (Heatmap)
```http
GET /dashboard/heatmap
```

**Response:**
```json
{
  "sucesso": true,
  "data": {
    "data": [
      {
        "city": "Imperatriz-MA",
        "bairro": "CENTRO",
        "address": "CENTRO, Imperatriz-MA, Brasil",
        "count": 15,
        "lat": -5.52,
        "long": -47.47
      },
      {
        "city": "São Paulo-SP",
        "bairro": "Vila Mariana",
        "address": "Vila Mariana, São Paulo-SP, Brasil",
        "count": 8,
        "lat": -23.58,
        "long": -46.63
      }
    ]
  },
  "message": "Dados do mapa de calor recuperados com sucesso"
}
```

---

## 🔧 Admin

### Cache Status
```http
GET /admin/cache/status
```

**Response:**
```json
{
  "sucesso": true,
  "data": {
    "motor_inicializado": true,
    "motor_created_at": "2025-01-15T10:30:00",
    "cache_last_cleared_at": "2025-01-15T09:00:00"
  },
  "message": "Status do cache recuperado"
}
```

---

### Clear Cache
```http
POST /admin/cache/clear
```

**Response:**
```json
{
  "sucesso": true,
  "data": {
    "motor_inicializado": true,
    "motor_created_at": "2025-01-15T11:00:00",
    "cache_last_cleared_at": "2025-01-15T11:00:00"
  },
  "message": "Cache limpo com sucesso"
}
```

---

### Listar PDFs
```http
GET /admin/pdfs
```

**Response:**
```json
{
  "sucesso": true,
  "data": [
    {
      "name": "240_25-KJ.pdf",
      "relpath": "pdfs/240_25-KJ.pdf",
      "size_bytes": 102400,
      "size_human": "100.0 KB",
      "modified_at": "2025-01-15 10:30:00",
      "doc_type": "pdf",
      "status": "ok"
    }
  ],
  "message": "Lista de PDFs recuperada"
}
```

---

## ⚠️ Error Responses

All endpoints may return error responses in this format:

```json
{
  "sucesso": false,
  "erro": {
    "codigo": "VALIDATION_ERROR",
    "mensagem": "Descrição do erro",
    "detalhes": { /* optional */ }
  }
}
```

**Common HTTP Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Validation error
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource (e.g., certificate number already exists)
- `500 Internal Server Error`: Server error

---

## 🔄 CORS

CORS is enabled for all origins (`*`). In production, configure `BACKEND_CORS_ORIGINS` in `.env`.

---

## 📝 Notes

1. All datetime fields are returned in ISO 8601 format: `YYYY-MM-DDTHH:MM:SS`
2. File paths in responses are absolute server paths
3. Use the `urls` object for client-side navigation/downloads
4. The heatmap endpoint uses OpenStreetMap Nominatim for geocoding (rate-limited, cached)
5. Excel uploads must be `.xlsx`, `.xls`, `.xlsm`, `.xltx`, or `.csv`

---

**Last Updated:** 2025-11-23
