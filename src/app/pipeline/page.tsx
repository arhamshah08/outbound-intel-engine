import PipelineView from '@/components/PipelineView'
import DatabaseSetup from '@/components/DatabaseSetup'

export default function PipelinePage() {
  return (
    <>
      <DatabaseSetup />
      <PipelineView />
    </>
  )
}
