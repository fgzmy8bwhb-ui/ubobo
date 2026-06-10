import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AddressState {
  savedAddress: string
  setSavedAddress: (address: string) => void
}

const useAddressStore = create<AddressState>()(
  persist(
    (set) => ({
      savedAddress: '',
      setSavedAddress: (savedAddress) => set({ savedAddress }),
    }),
    { name: 'ubobo_address' }
  )
)

export default useAddressStore
