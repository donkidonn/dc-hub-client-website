import MainContent from './MainContent'
import Statistics from './Statistics'
import Leaderboard from './Leaderboard'
import Slots from './Slots'

// Placeholder for pages not yet built
function ComingSoon({ page }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-sm" style={{ color: 'rgba(139,92,246,0.6)' }}>
        {page} — coming soon
      </p>
    </div>
  )
}

export default function PageContent({ activePage }) {
  switch (activePage) {
    case 'Home':
      return <MainContent />
    case 'Statistics':
      return <Statistics />
    case 'Slots':
      return <Slots />
    case 'Leaderboards':
      return <Leaderboard />
    default:
      return <MainContent />
  }
}
