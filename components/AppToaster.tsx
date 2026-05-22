'use client'

import { Toaster } from 'react-hot-toast'
import AppToast from './AppToast'

export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      containerStyle={{ top: 20, zIndex: 99999 }}
      gutter={10}
    >
      {(t) => <AppToast t={t} />}
    </Toaster>
  )
}
