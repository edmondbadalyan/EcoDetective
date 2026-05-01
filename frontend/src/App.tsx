import { Navigate, Route, Routes } from 'react-router-dom'
import { KidHomePage } from './pages/kid/KidHomePage'
import { ForestMapPage } from './pages/kid/ForestMapPage'
import { CasePage } from './pages/kid/CasePage'
import { CaseFinalePage } from './pages/kid/CaseFinalePage'
import { EvidenceAlbumPage } from './pages/kid/EvidenceAlbumPage'
import { ClueBriefPage } from './pages/kid/ClueBriefPage'
import { EvidenceUploadPage } from './pages/kid/EvidenceUploadPage'
import { SubmittedPage } from './pages/kid/SubmittedPage'
import { RewardPage } from './pages/kid/RewardPage'
import { ParentGatePage } from './pages/parent/ParentGatePage'
import { ParentDashboardPage } from './pages/parent/ParentDashboardPage'
import { ReviewQueuePage } from './pages/parent/ReviewQueuePage'
import { ReviewDetailPage } from './pages/parent/ReviewDetailPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/kid" replace />} />

      <Route path="/kid" element={<KidHomePage />} />
      <Route path="/kid/map" element={<ForestMapPage />} />
      <Route path="/kid/album" element={<EvidenceAlbumPage />} />
      <Route path="/kid/case/:caseId" element={<CasePage />} />
      <Route path="/kid/case/:caseId/finale" element={<CaseFinalePage />} />
      <Route path="/kid/task/:taskId" element={<ClueBriefPage />} />
      <Route path="/kid/task/:taskId/evidence" element={<EvidenceUploadPage />} />
      <Route path="/kid/submitted/:submissionId" element={<SubmittedPage />} />
      <Route path="/kid/reward/:submissionId" element={<RewardPage />} />

      <Route path="/parent" element={<ParentGatePage />} />
      <Route path="/parent/dashboard" element={<ParentDashboardPage />} />
      <Route path="/parent/review" element={<ReviewQueuePage />} />
      <Route path="/parent/review/:submissionId" element={<ReviewDetailPage />} />

      <Route path="*" element={<Navigate to="/kid" replace />} />
    </Routes>
  )
}

