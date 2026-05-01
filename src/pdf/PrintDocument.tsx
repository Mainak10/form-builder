// src/pdf/PrintDocument.tsx — stub, Phase 7 will implement the full formatted version
import type { FormResponse } from '@/types'

interface Props {
  response: FormResponse
}

export default function PrintDocument({ response }: Props) {
  return <div className="print-doc">{response.schemaSnapshot.title}</div>
}
