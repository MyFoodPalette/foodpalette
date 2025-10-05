import { createFileRoute } from '@tanstack/react-router'
import FoodSearchComponent from '../FoodSearchComponent'
import '../App.css'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {

  return <FoodSearchComponent />
}
