import { useParams } from 'react-router-dom'

export default function InstancesListPage() {
  const { templateId } = useParams()
  return <div style={{ padding: 24 }}><h1>Responses for {templateId}</h1></div>
}
