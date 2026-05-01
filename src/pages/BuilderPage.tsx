import { useParams } from 'react-router-dom'

export default function BuilderPage() {
  const { templateId } = useParams()
  return <div style={{ padding: 24 }}><h1>Builder {templateId ?? 'new'}</h1></div>
}
