import { useEffect, useState } from 'react'
import { products } from './data/products.js'
import { Navbar } from './components/Navbar.jsx'
import { HomePage } from './components/HomePage.jsx'
import { MenuPage } from './components/MenuPage.jsx'
import { AuthPage } from './components/AuthPage.jsx'
import { Footer } from './components/Footer.jsx'
import { Toast } from './components/Toast.jsx'
import { CheckoutModal } from './components/CheckoutModal.jsx'

const storedCart = () => {
  try {
    const value = JSON.parse(localStorage.getItem('texasCart') || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

const currentPage = () => {
  const path = window.location.pathname.toLowerCase()
  if (path.endsWith('/menu') || path.endsWith('/menu.html')) return 'menu'
  if (path.endsWith('/login') || path.endsWith('/login.html')) return 'login'
  if (path.endsWith('/registro') || path.endsWith('/registro.html')) return 'register'
  return 'home'
}

function App() {
  const [page] = useState(currentPage)
  const [loggedIn, setLoggedIn] = useState(() => localStorage.getItem('texasLoggedIn') === 'true')
  const [cart, setCart] = useState(storedCart)
  const [cartOpen, setCartOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [order, setOrder] = useState(null)
  const [redirectReason, setRedirectReason] = useState('')

  useEffect(() => {
    localStorage.setItem('texasCart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    if (page !== 'login') return
    const reason = sessionStorage.getItem('loginRedirectReason')
    if (reason) {
      setRedirectReason(reason)
      sessionStorage.removeItem('loginRedirectReason')
    }
  }, [page])

  useEffect(() => {
    const closeCart = () => setCartOpen(false)
    window.addEventListener('click', closeCart)
    return () => window.removeEventListener('click', closeCart)
  }, [])

  const addProduct = (product) => {
    if (!loggedIn) {
      sessionStorage.setItem('loginRedirectReason', 'Debes iniciar sesión para agregar productos a tu pedido.')
      window.location.href = '/login.html'
      return
    }
    setCart((current) => {
      const existing = current.find((item) => item.name === product.name)
      return existing
        ? current.map((item) => item.name === product.name ? { ...item, qty: item.qty + 1 } : item)
        : [...current, { ...product, id: Date.now() + Math.random(), qty: 1 }]
    })
    setToast({ message: `${product.name} agregado al pedido`, action: 'Ver carrito' })
  }

  const changeQuantity = (id, change) => {
    setCart((current) => current
      .map((item) => item.id === id ? { ...item, qty: item.qty + change } : item)
      .filter((item) => item.qty > 0))
  }

  const removeProduct = (id) => setCart((current) => current.filter((item) => item.id !== id))

  const checkout = () => {
    const count = cart.reduce((sum, item) => sum + item.qty, 0)
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
    const number = Math.floor(Math.random() * 90000) + 10000
    setOrder({ number: `#TX-${number}`, count, total: total.toFixed(2) })
    setCart([])
    setCartOpen(false)
  }

  const logout = () => {
    localStorage.removeItem('texasLoggedIn')
    setLoggedIn(false)
    setCartOpen(false)
    window.alert('Has cerrado sesión.')
    window.location.href = '/index.html'
  }

  const authenticate = (message) => {
    localStorage.setItem('texasLoggedIn', 'true')
    setLoggedIn(true)
    window.alert(message)
    window.location.href = '/menu.html'
  }

  return (
    <div className="app-shell">
      <Navbar
        page={page}
        loggedIn={loggedIn}
        cart={cart}
        cartOpen={cartOpen}
        onToggleCart={() => setCartOpen((open) => !open)}
        onChangeQuantity={changeQuantity}
        onRemoveProduct={removeProduct}
        onCheckout={checkout}
        onLogout={logout}
      />
      {page === 'home' && <HomePage />}
      {page === 'menu' && <MenuPage products={products} onAddProduct={addProduct} />}
      {(page === 'login' || page === 'register') && (
        <AuthPage page={page} redirectReason={redirectReason} onAuthenticate={authenticate} />
      )}
      <Footer page={page} />
      {toast && <Toast message={toast.message} action={toast.action} onAction={() => setCartOpen(true)} onClose={() => setToast(null)} />}
      {order && <CheckoutModal order={order} onClose={() => setOrder(null)} />}
    </div>
  )
}

export default App
