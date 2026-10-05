import AuthPageLayout from '@src/components/AuthPageLayout'

function RouteLoadingFallback() {
  return (
    <AuthPageLayout
      description="Opening this page…"
      heading="Getting Flock ready"
      isStatus
    />
  )
}

export default RouteLoadingFallback
