export interface FilePreview {
  headers: string[]
  rows: string[][]
  totalRows: number
  format: 'CSV' | 'PSV'
}

export function inferFileFormat(filename: string): FilePreview['format'] | null {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.csv')) return 'CSV'
  if (lower.endsWith('.psv')) return 'PSV'
  return null
}

export async function buildPreview(
  file: File,
  format: FilePreview['format'],
): Promise<FilePreview> {
  const text = await file.text()
  const delimiter = format === 'CSV' ? ',' : '|'
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    throw new Error('File must include a header row and at least one data row.')
  }

  const headers = lines[0].split(delimiter).map((cell) => cell.trim())
  const rows = lines.slice(1, 6).map((line) => line.split(delimiter).map((cell) => cell.trim()))

  return {
    headers,
    rows,
    totalRows: lines.length - 1,
    format,
  }
}

export function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}
