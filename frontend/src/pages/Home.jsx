import React, { useState, useEffect } from 'react';
import { useOrder } from '../context/OrderContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronRight, CheckCircle, Info, Sparkles, AlertTriangle } from 'lucide-react';

function Home({ addToast }) {
  const {
    inventory,
    standardPizzas,
    createPendingOrder,
    confirmPaidOrder,
    createRazorpayTx,
  } = useOrder();
  const navigate = useNavigate();

  // Builder steps: base | sauce | cheese | toppings
  const [step, setStep] = useState('base');

  // Selected ingredients states
  const [selectedBase, setSelectedBase] = useState('');
  const [selectedSauce, setSelectedSauce] = useState('');
  const [selectedCheese, setSelectedCheese] = useState('');
  const [selectedVeggies, setSelectedVeggies] = useState([]);
  const [selectedMeats, setSelectedMeats] = useState([]);

  // Checkout states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isPaying, setIsPaying] = useState(false);

  // Auto-select defaults when inventory loads
  useEffect(() => {
    if (inventory.length > 0) {
      const bases = inventory.filter(i => i.category === 'base' && i.quantity > 0);
      if (bases.length > 0 && !selectedBase) setSelectedBase(bases[0].name);

      const sauces = inventory.filter(i => i.category === 'sauce' && i.quantity > 0);
      if (sauces.length > 0 && !selectedSauce) setSelectedSauce(sauces[0].name);

      const cheeses = inventory.filter(i => i.category === 'cheese' && i.quantity > 0);
      if (cheeses.length > 0 && !selectedCheese) setSelectedCheese(cheeses[0].name);
    }
  }, [inventory]);

  // Topping placements helper for visual canvas rendering
  // Generate random fixed coordinates so toppings don't jump around on re-renders
  const [toppingPlacements, setToppingPlacements] = useState([]);

  useEffect(() => {
    const placements = [];
    // Generate 12 slots for toppings on the circular pizza canvas
    for (let i = 0; i < 12; i++) {
      const angle = (i * 2 * Math.PI) / 12 + Math.random() * 0.3;
      const radius = 12 + Math.random() * 24; // Position within 12% to 36% of circle (inside cheese layer)
      const top = 50 + radius * Math.sin(angle);
      const left = 50 + radius * Math.cos(angle);
      placements.push({ top: `${top}%`, left: `${left}%`, rotate: `${Math.random() * 360}deg` });
    }
    setToppingPlacements(placements);
  }, []);

  // Price calculations
  const calculatePrice = () => {
    let price = 199; // Base cost of pizza crust
    if (selectedSauce) price += 30;
    if (selectedCheese) price += 50;
    price += selectedVeggies.length * 25;
    price += selectedMeats.length * 45;
    return price;
  };

  // Check stock level for single ingredient
  const getIngredientStock = (name) => {
    const item = inventory.find(i => i.name.toLowerCase() === name.toLowerCase());
    return item ? item.quantity : 0;
  };

  const isOutOfStock = (name) => {
    return getIngredientStock(name) <= 0;
  };

  const handleVeggieToggle = (vegName) => {
    if (isOutOfStock(vegName) && !selectedVeggies.includes(vegName)) {
      addToast(`${vegName} is currently out of stock.`, 'error');
      return;
    }
    setSelectedVeggies(prev =>
      prev.includes(vegName) ? prev.filter(v => v !== vegName) : [...prev, vegName]
    );
  };

  const handleMeatToggle = (meatName) => {
    if (isOutOfStock(meatName) && !selectedMeats.includes(meatName)) {
      addToast(`${meatName} is currently out of stock.`, 'error');
      return;
    }
    setSelectedMeats(prev =>
      prev.includes(meatName) ? prev.filter(m => m !== meatName) : [...prev, meatName]
    );
  };

  // Build the order list object
  const handleCheckoutOpen = async (customPizza = null) => {
    let orderItems = [];
    let price = 0;

    if (customPizza) {
      // Custom Pizza
      orderItems = [{
        name: 'Custom Pizza Craft',
        customized: true,
        base: selectedBase,
        sauce: selectedSauce,
        cheese: selectedCheese,
        veggies: selectedVeggies,
        meats: selectedMeats,
        price: calculatePrice(),
        quantity: 1
      }];
      price = calculatePrice();
    } else {
      return;
    }

    try {
      setLoadingBtn(true);
      const pendingOrder = await createPendingOrder(orderItems, price);
      setCurrentOrder(pendingOrder);
      setIsCheckoutOpen(true);
    } catch (err) {
      addToast(err.message || 'Stock allocation verification failed.', 'error');
    } finally {
      setLoadingBtn(false);
    }
  };

  const handleStandardCheckout = async (pizza) => {
    const orderItems = [{
      name: pizza.name,
      customized: false,
      base: pizza.base,
      sauce: pizza.sauce,
      cheese: pizza.cheese,
      veggies: pizza.veggies,
      meats: pizza.meats,
      price: pizza.price,
      quantity: 1
    }];

    try {
      setLoadingBtn(true);
      const pendingOrder = await createPendingOrder(orderItems, pizza.price);
      setCurrentOrder(pendingOrder);
      setIsCheckoutOpen(true);
    } catch (err) {
      addToast(err.message || 'Stock allocation verification failed.', 'error');
    } finally {
      setLoadingBtn(false);
    }
  };

  const [loadingBtn, setLoadingBtn] = useState(false);

  // payment confirmation handler
  const handlePayment = async () => {
    if (!currentOrder) return;
    setIsPaying(true);

    try {
      // 1. Create a Razorpay Order transaction reference on backend
      const rzTx = await createRazorpayTx(currentOrder.totalAmount);
      
      // 2. Determine if Razorpay keys are dummy/fallback (simulated sandbox)
      if (rzTx.isMock) {
        // Trigger simulated success directly after a timeout to display a stunning glassmorphic UI animation
        setTimeout(async () => {
          try {
            const mockPayId = `pay_simulated_${Math.random().toString(36).substr(2, 9)}`;
            await confirmPaidOrder(currentOrder._id || currentOrder.id, mockPayId, true);
            addToast('Payment Successful (Simulated)! Order Confirmed.', 'success');
            setIsCheckoutOpen(false);
            setIsPaying(false);
            navigate('/dashboard');
          } catch (e) {
            addToast(e.message || 'Failed to verify transaction.', 'error');
            setIsPaying(false);
          }
        }, 1500);
      } else {
        // Standard Real Razorpay checkout flow
        const options = {
          key: rzTx.key_id,
          amount: rzTx.amount,
          currency: rzTx.currency,
          name: 'Slicely Pizza Delivery',
          description: 'Payment for your Custom Pizza Order',
          order_id: rzTx.id,
          handler: async (response) => {
            try {
              await confirmPaidOrder(
                currentOrder._id || currentOrder.id,
                response.razorpay_payment_id,
                false
              );
              addToast('Payment Successful! Order Confirmed.', 'success');
              setIsCheckoutOpen(false);
              setIsPaying(false);
              navigate('/dashboard');
            } catch (err) {
              addToast('Payment verification failed on server.', 'error');
              setIsPaying(false);
            }
          },
          prefill: {
            name: 'Oasis Intern',
            email: 'intern@oasisinfobyte.com',
          },
          theme: {
            color: '#f97316',
          },
          modal: {
            ondismiss: () => {
              addToast('Payment cancelled.', 'error');
              setIsPaying(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      addToast('Payment transaction initialization failed.', 'error');
      setIsPaying(false);
    }
  };

  const getCrustClass = () => {
    if (selectedBase.includes('Thin')) return 'thin';
    if (selectedBase.includes('Wheat')) return 'wheat';
    if (selectedBase.includes('Burst')) return 'cheese-burst';
    return '';
  };

  const getSauceClass = () => {
    if (!selectedSauce) return '';
    if (selectedSauce.includes('Marinara')) return 'marinara';
    if (selectedSauce.includes('Schezwan')) return 'schezwan';
    if (selectedSauce.includes('Alfredo')) return 'alfredo';
    if (selectedSauce.includes('Pesto')) return 'pesto';
    return 'bbq';
  };

  const getCheeseClass = () => {
    if (!selectedCheese) return '';
    if (selectedCheese.includes('Mozzarella')) return 'mozzarella';
    if (selectedCheese.includes('Cheddar')) return 'cheddar';
    if (selectedCheese.includes('Parmesan')) return 'parmesan';
    if (selectedCheese.includes('Blue')) return 'blue-cheese';
    return 'feta';
  };

  const getToppingStyle = (name, index, total = 8) => {
    const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    
    // Golden angle in radians for organic, non-colliding spread
    const goldenAngle = 137.5 * (Math.PI / 180);
    
    // Calculate angle based on index and golden ratio
    // Add a hash offset so different toppings have different starting patterns
    const angle = index * goldenAngle + (hash % 360) * (Math.PI / 180);
    
    // Distribute radius outward organically using square root for equal-area spread
    // Max radius is kept around 30% to stay inside the crust
    const radius = 4 + Math.sqrt((index + 1) / total) * 26; 
    
    const top = 50 + radius * Math.sin(angle);
    const left = 50 + radius * Math.cos(angle);
    const rotate = (hash * 17 + index * 45) % 360;

    return {
      position: 'absolute',
      top: `${top}%`,
      left: `${left}%`,
      '--rotate': `${rotate}deg`,
      zIndex: 12 + (index % 3),
      animationDelay: `${index * 0.04}s`
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
      
      {/* Title Header Hero */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignSelf: 'center', gap: '0.4rem', background: 'rgba(249, 115, 22, 0.1)', color: 'var(--primary)', padding: '0.4rem 1rem', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 600 }}>
          <Sparkles size={14} /> Crafted Fresh Just For You
        </div>
        <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
          Create Your <span className="gradient-text">Dream Pizza</span> Customly
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Select custom bases, gourmet sauces, premium cheeses, and fresh toppings. Visualize your pizza build in real-time before checking out.
        </p>
      </section>

      {/* Main Interactive Pizza Builder Section */}
      <section className="glass-panel builder-layout slide-up" style={{ padding: '2rem' }}>
        
        {/* Left Side Customizer Steps Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.8rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔨 Crust Customizer
          </h2>

          {/* Builder Steps Navigation links */}
          <div style={{ display: 'flex', gap: '0.3rem', background: 'rgba(0,0,0,0.2)', padding: '0.3rem', borderRadius: '10px', overflowX: 'auto' }}>
            {['base', 'sauce', 'cheese', 'toppings'].map(s => (
              <button
                key={s}
                onClick={() => setStep(s)}
                style={{ flex: 1, padding: '0.5rem 0.8rem', border: 'none', background: step === s ? 'var(--primary)' : 'none', color: step === s ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap' }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Step Panels */}
          <div style={{ minHeight: '220px' }}>
            {/* BASE SELECTION */}
            {step === 'base' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {inventory.filter(i => i.category === 'base').map(item => {
                  const outOfStock = item.quantity <= 0;
                  return (
                    <button
                      key={item.id || item._id}
                      onClick={() => !outOfStock && setSelectedBase(item.name)}
                      className={`glass-card`}
                      style={{ padding: '1rem', cursor: outOfStock ? 'not-allowed' : 'pointer', border: selectedBase === item.name ? '2px solid var(--primary)' : '1px solid var(--border-light)', background: selectedBase === item.name ? 'var(--bg-card-hover)' : 'var(--bg-card)', opacity: outOfStock ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'between' }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>{item.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {outOfStock ? 'Out of stock' : `${item.quantity} available`}
                        </div>
                      </div>
                      <div style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--primary)' }}>
                        {selectedBase === item.name && <CheckCircle size={18} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* SAUCE SELECTION */}
            {step === 'sauce' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {inventory.filter(i => i.category === 'sauce').map(item => {
                  const outOfStock = item.quantity <= 0;
                  return (
                    <button
                      key={item.id || item._id}
                      onClick={() => !outOfStock && setSelectedSauce(item.name)}
                      className={`glass-card`}
                      style={{ padding: '1rem', cursor: outOfStock ? 'not-allowed' : 'pointer', border: selectedSauce === item.name ? '2px solid var(--primary)' : '1px solid var(--border-light)', background: selectedSauce === item.name ? 'var(--bg-card-hover)' : 'var(--bg-card)', opacity: outOfStock ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'between' }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>{item.name} Sauce</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {outOfStock ? 'Out of stock' : `${item.quantity} available`}
                        </div>
                      </div>
                      <div style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--primary)' }}>
                        {selectedSauce === item.name && <CheckCircle size={18} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* CHEESE SELECTION */}
            {step === 'cheese' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {inventory.filter(i => i.category === 'cheese').map(item => {
                  const outOfStock = item.quantity <= 0;
                  return (
                    <button
                      key={item.id || item._id}
                      onClick={() => !outOfStock && setSelectedCheese(item.name)}
                      className={`glass-card`}
                      style={{ padding: '1rem', cursor: outOfStock ? 'not-allowed' : 'pointer', border: selectedCheese === item.name ? '2px solid var(--primary)' : '1px solid var(--border-light)', background: selectedCheese === item.name ? 'var(--bg-card-hover)' : 'var(--bg-card)', opacity: outOfStock ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'between' }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>{item.name} Cheese</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {outOfStock ? 'Out of stock' : `${item.quantity} available`}
                        </div>
                      </div>
                      <div style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--primary)' }}>
                        {selectedCheese === item.name && <CheckCircle size={18} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TOPPINGS SELECTION */}
            {step === 'toppings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fresh Veggies (+₹25 each)</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {inventory.filter(i => i.category === 'veggie').map(item => {
                      const outOfStock = item.quantity <= 0;
                      const selected = selectedVeggies.includes(item.name);
                      return (
                        <button
                          key={item.id || item._id}
                          onClick={() => handleVeggieToggle(item.name)}
                          style={{
                            padding: '0.5rem 0.8rem',
                            borderRadius: '8px',
                            border: selected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                            background: selected ? 'rgba(249, 115, 22, 0.1)' : outOfStock ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                            color: selected ? '#fff' : outOfStock ? 'var(--text-muted)' : 'var(--text-primary)',
                            cursor: outOfStock ? 'not-allowed' : 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            opacity: outOfStock ? 0.4 : 1
                          }}
                        >
                          {item.name} {outOfStock && '🚫'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gourmet Meats (+₹45 each)</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {inventory.filter(i => i.category === 'meat').map(item => {
                      const outOfStock = item.quantity <= 0;
                      const selected = selectedMeats.includes(item.name);
                      return (
                        <button
                          key={item.id || item._id}
                          onClick={() => handleMeatToggle(item.name)}
                          style={{
                            padding: '0.5rem 0.8rem',
                            borderRadius: '8px',
                            border: selected ? '2px solid var(--secondary)' : '1px solid var(--border-light)',
                            background: selected ? 'rgba(225, 29, 72, 0.1)' : outOfStock ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                            color: selected ? '#fff' : outOfStock ? 'var(--text-muted)' : 'var(--text-primary)',
                            cursor: outOfStock ? 'not-allowed' : 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            opacity: outOfStock ? 0.4 : 1
                          }}
                        >
                          {item.name} {outOfStock && '🚫'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing summary */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Subtotal Price</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>₹{calculatePrice()}</div>
            </div>
            <button
              onClick={() => handleCheckoutOpen(true)}
              className="btn-primary"
              style={{ padding: '0.8rem 1.5rem' }}
              disabled={loadingBtn || !selectedBase}
            >
              {loadingBtn ? 'Securing stock...' : 'Order Pizza'} <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right Side Rotating Animated Pizza Canvas Preview */}
        <div className="pizza-preview-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="pizza-canvas float-animation">
            
            {/* Base Crust Layer */}
            {selectedBase && (
              <div className={`pizza-crust ${getCrustClass()}`}></div>
            )}

            {/* Sauce Layer */}
            <div className={`pizza-sauce pizza-layer ${selectedSauce ? 'active' : ''} ${getSauceClass()}`}></div>

            {/* Cheese Layer */}
            <div className={`pizza-cheese pizza-layer ${selectedCheese ? 'active' : ''} ${getCheeseClass()}`}></div>

            {/* Veggies Toppings Layer */}
            {selectedVeggies.map((veg, vegIndex) => {
              const toppingClass = `topping-${veg.toLowerCase().replace(' ', '-')}`;
              // Scatter 8 instances organically
              return Array.from({ length: 8 }).map((_, instanceIndex) => (
                <div
                  key={`veg-${vegIndex}-${instanceIndex}`}
                  className={`topping-item-visual ${toppingClass}`}
                  style={getToppingStyle(veg, instanceIndex, 8)}
                />
              ));
            })}

            {/* Meats Toppings Layer */}
            {selectedMeats.map((meat, meatIndex) => {
              const toppingClass = `topping-${meat.toLowerCase().replace(' ', '-')}`;
              // Scatter 6 instances organically
              return Array.from({ length: 6 }).map((_, instanceIndex) => (
                <div
                  key={`meat-${meatIndex}-${instanceIndex}`}
                  className={`topping-item-visual ${toppingClass}`}
                  style={getToppingStyle(meat, instanceIndex, 6)}
                />
              ));
            })}
          </div>

          {/* visual descriptor card */}
          <div className="glass-card" style={{ marginTop: '2.5rem', width: '100%', maxWidth: '340px', padding: '0.8rem 1.2rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderStyle: 'dashed' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <Info size={14} style={{ color: 'var(--primary)' }} /> Live 2D Pizza Visualizer Enabled
            </span>
          </div>
        </div>
      </section>

      {/* Available Pizza Varieties Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
          Popular <span className="gradient-text">Classic Favorites</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {standardPizzas.map(pizza => (
            <div key={pizza.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'between', height: '100%' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.8rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>
                {pizza.image}
              </div>
              <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '0.4rem' }}>{pizza.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.35', flexGrow: 1, marginBottom: '1.2rem' }}>
                {pizza.description}
              </p>
              
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>₹{pizza.price}</span>
                <button
                  onClick={() => handleStandardCheckout(pizza)}
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                >
                  Order Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Payment Checkout Modal Drawer */}
      {isCheckoutOpen && currentOrder && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h2 style={{ fontSize: '1.6rem', marginBottom: '1.2rem', fontFamily: 'var(--font-display)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.8rem' }}>
              Confirm Payment
            </h2>

            {/* Cart Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>Order Summary</div>
                {currentOrder.items.map((item, idx) => (
                  <div key={idx} style={{ fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'between', fontWeight: 600, color: '#fff' }}>
                      <span>{item.name}</span>
                      <span>₹{item.price}</span>
                    </div>
                    {item.customized && (
                      <div style={{ color: 'var(--text-secondary)', paddingLeft: '0.5rem', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                        <div>• Crust: {item.base}</div>
                        <div>• Sauce: {item.sauce}</div>
                        <div>• Cheese: {item.cheese}</div>
                        {item.veggies.length > 0 && <div>• Veggies: {item.veggies.join(', ')}</div>}
                        {item.meats.length > 0 && <div>• Meats: {item.meats.join(', ')}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Dynamic Warning Indicator if simulated gateway is active */}
              <div className="glass-card" style={{ padding: '0.8rem', borderLeft: '4px solid var(--primary)', background: 'rgba(249, 115, 22, 0.04)', fontSize: '0.8rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: '#fff', marginBottom: '0.2rem' }}>
                  <AlertTriangle size={14} style={{ color: 'var(--primary)' }} />
                  Razorpay Sandbox Test Active
                </span>
                We are running in mock test mode. Clicking confirm will simulate verification signatures and approve payment automatically.
              </div>

              <div style={{ display: 'flex', justifyContent: 'between', fontSize: '1.2rem', fontWeight: 800, borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                <span>Total Amount:</span>
                <span style={{ color: 'var(--primary)' }}>₹{currentOrder.totalAmount}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="btn-secondary"
                style={{ flex: 1 }}
                disabled={isPaying}
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                className="btn-primary"
                style={{ flex: 2 }}
                disabled={isPaying}
              >
                {isPaying ? 'Processing...' : `Pay ₹${currentOrder.totalAmount}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
