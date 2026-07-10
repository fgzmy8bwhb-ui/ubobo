// Logos des moyens de paiement en SVG inline

export function LogoCB() {
  return (
    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white border border-line">
      <img src="/cb.jpg" alt="CB" className="h-8 w-8 object-contain" />
    </span>
  )
}

export function LogoVisa() {
  return (
    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#1A1F71]">
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
        <rect width="40" height="40" rx="10" fill="#1A1F71"/>
        <text x="50%" y="57%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="13" fontWeight="900" fontFamily="Arial,sans-serif" letterSpacing="0.5">VISA</text>
      </svg>
    </span>
  )
}

export function LogoMastercard() {
  return (
    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#1A1A1A]">
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
        <rect width="40" height="40" rx="10" fill="#1A1A1A"/>
        <circle cx="15" cy="20" r="9" fill="#EB001B"/>
        <circle cx="25" cy="20" r="9" fill="#F79E1B"/>
        <path d="M20 12.7a9 9 0 0 1 0 14.6A9 9 0 0 1 20 12.7z" fill="#FF5F00"/>
      </svg>
    </span>
  )
}

export function LogoApplePay() {
  return (
    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-black">
      <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
        <rect width="40" height="40" rx="10" fill="black"/>
        {/* Apple logo */}
        <path d="M20.5 11c.9-1.1 2.3-1.8 3.5-1.8.1 1.4-.4 2.8-1.3 3.8-.8 1-2.1 1.7-3.4 1.6-.1-1.3.4-2.7 1.2-3.6z" fill="white"/>
        <path d="M24 14.1c-1.8 0-2.6 1.1-3.9 1.1-1.3 0-2.3-1-3.8-1-1.9 0-4 1.7-4 5.1 0 2 .7 4.2 1.6 5.6.7 1.2 1.5 2.1 2.5 2.1s1.4-.7 2.7-.7c1.3 0 1.6.7 2.8.7 1 0 1.8-.9 2.5-2 .5-.8.8-1.6 1-2.2-2.5-1-2.9-4.8-.4-6.2-.8-1.2-2-1.5-3-1.5z" fill="white"/>
        {/* Pay text */}
        <text x="50%" y="77%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="8" fontWeight="500" fontFamily="-apple-system,sans-serif">Pay</text>
      </svg>
    </span>
  )
}

export function LogoCash() {
  return null
}
