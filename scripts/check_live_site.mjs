const url = 'https://maison-mikell.netlify.app'
const response = await fetch(url)
const html = await response.text()
console.log(JSON.stringify({
  ok: response.ok,
  status: response.status,
  hasMaisonMikell: html.includes('Maison'),
  hasWelcomeHome: html.includes('Welcome home.'),
  hasJoinHousehold: html.includes('Join this household'),
  length: html.length,
}, null, 2))
