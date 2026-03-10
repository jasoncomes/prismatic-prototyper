import { StoreProvider, useStore } from "@/data/store"
import { NewIntegrationScreen } from "@/screens/new-integration"
import { DesignerCanvasScreen } from "@/screens/designer-canvas"
import { AddStepScreen } from "@/screens/add-step"
import { ConnectionSetupScreen } from "@/screens/connection-setup"
import { ComponentManagementModal } from "@/screens/component-management-modal"

const ScreenRouter = () => {
  const { screen } = useStore()

  return (
    <>
      {screen === "new-integration" && <NewIntegrationScreen />}
      {screen === "designer" && <DesignerCanvasScreen />}
      {screen === "add-step" && <AddStepScreen />}
      {screen === "connection-setup" && <ConnectionSetupScreen />}
      <ComponentManagementModal />
    </>
  )
}

const App = () => (
  <StoreProvider>
    <ScreenRouter />
  </StoreProvider>
)

export default App
