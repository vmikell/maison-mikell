import { buildTasksFromSetup } from '../src/lib/model.js'
import { shoppingLists } from '../src/lib/data.js'

const scenarios = [
  {
    name: 'condo-mini-split',
    setup: {
      name: 'Mikell Home',
      homeType: 'Condo',
      sizeSqFt: 1200,
      levels: 2,
      bedrooms: 2,
      bathrooms: 1.5,
      hvac: { system: 'Mini split heat pump', heads: 4 },
    },
  },
  {
    name: 'single-family-forced-air',
    setup: {
      name: 'Maple House',
      homeType: 'Single family house',
      sizeSqFt: 1800,
      levels: 2,
      bedrooms: 3,
      bathrooms: 2,
      hvac: { system: 'Forced air', heads: '' },
    },
  },
]

const results = scenarios.map(({ name, setup }) => {
  const tasks = buildTasksFromSetup(setup)
  return {
    name,
    taskCount: tasks.length,
    titles: tasks.map((task) => task.title),
    hasMiniSplitTask: tasks.some((task) => /mini split/i.test(task.title) || /mini split/i.test(task.system || '')),
    hasExteriorTask: tasks.some((task) => /exterior doors/i.test(task.title)),
    hasHalfBathTask: tasks.some((task) => /half bath|powder room/i.test(task.title)),
  }
})

console.log(JSON.stringify({
  shoppingListsSeededEmpty: shoppingLists.every((list) => Array.isArray(list.items) && list.items.length === 0),
  results,
}, null, 2))
