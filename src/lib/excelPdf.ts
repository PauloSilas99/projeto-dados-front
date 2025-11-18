export type PageOrientation = 'portrait' | 'landscape'

export interface ExcelPdfOptions {
  sheet?: string | 'all'
  orientation?: PageOrientation
  fitToPage?: boolean
  includeGridlines?: boolean
  footerText?: string
}

interface ExcelPdfLibrary {
  convert: (file: File, options?: ExcelPdfOptions) => Promise<Blob | ArrayBuffer | Uint8Array>
  getSheetNames?: (file: File) => Promise<string[]>
}

declare global {
  interface Window {
    ExcelPdf?: ExcelPdfLibrary
  }
}

function ensureLibrary(): ExcelPdfLibrary {
  if (!window.ExcelPdf) {
    throw new Error(
      'Biblioteca de conversão não encontrada. Verifique se o script da biblioteca foi importado antes de usar o front-end.',
    )
  }

  return window.ExcelPdf
}

function normalizeToBlob(output: Blob | ArrayBuffer | Uint8Array): Blob {
  if (output instanceof Blob) {
    return output
  }

  if (output instanceof ArrayBuffer) {
    return new Blob([output as ArrayBuffer], { type: 'application/pdf' })
  }

  if (output instanceof Uint8Array) {
    const bufferCopy = output.buffer.slice(
      output.byteOffset,
      output.byteOffset + output.byteLength,
    ) as ArrayBuffer
    return new Blob([bufferCopy], { type: 'application/pdf' })
  }

  throw new Error('Formato de retorno não suportado pela biblioteca de conversão')
}

export async function convertExcelToPdf(file: File, options?: ExcelPdfOptions): Promise<Blob> {
  const library = ensureLibrary()
  const result = await library.convert(file, options)
  return normalizeToBlob(result)
}

export async function fetchSheetNames(file: File): Promise<string[]> {
  const library = ensureLibrary()

  if (!library.getSheetNames) {
    return []
  }

  try {
    return await library.getSheetNames(file)
  } catch (error) {
    console.warn('Não foi possível obter o nome das abas do arquivo Excel.', error)
    return []
  }
}


