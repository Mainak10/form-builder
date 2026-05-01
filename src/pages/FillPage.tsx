import { useParams } from 'react-router-dom'

export default function FillPage() {
  const { templateId } = useParams()
  return <div style={{ padding: 24 }}><h1>Fill {templateId}</h1></div>
}
