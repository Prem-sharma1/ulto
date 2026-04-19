import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Shield, Clock } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-dark-900 overflow-hidden relative">
      {/* Background glowing effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-500/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 flex justify-between items-center px-4 md:px-8 py-4">
        <div className="text-xl md:text-2xl font-black tracking-tighter uppercase">
          ULT<span className="text-primary-500">O</span>
        </div>
        <div className="flex gap-2 md:gap-4">
          <Link to="/login" className="px-3 md:px-5 py-2 text-xs md:text-sm font-semibold text-white/80 hover:text-white transition-colors">
            Log in
          </Link>
          <Link to="/register" className="primary-btn text-xs md:text-sm py-2 px-4 md:px-5 !rounded-full">
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20 flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
        <motion.div 
          className="lg:w-1/2"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black leading-tight mb-6">
            Go anywhere with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-500">
              ulto
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-lg">
            Request a ride, hop in, and go. Premium experience for both riders and drivers completely built for your comfort.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-12 lg:mb-0">
            <Link to="/register" className="primary-btn text-center text-base md:text-lg py-3 md:py-4 w-full sm:w-auto min-w-[160px] md:min-w-[200px]">
              Get a Ride
            </Link>
            <Link to="/register" className="glass hover:bg-white/10 text-white font-bold py-3 md:py-4 px-6 rounded-lg text-center transition-colors text-base md:text-lg w-full sm:w-auto min-w-[160px] md:min-w-[200px]">
              Become a Driver
            </Link>
          </div>
        </motion.div>

        <motion.div 
          className="lg:w-1/2 relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Mockup Map Image - Using a placeholder for now until we have real dashboard */}
          <div className="glass rounded-3xl p-4 rotate-3 shadow-2xl relative z-10 w-full max-w-md mx-auto aspect-[9/16] flex flex-col">
            <div className="bg-dark-900 rounded-2xl flex-1 relative overflow-hidden border border-white/5">
                {/* Simulated map route */}
                <div className="absolute inset-0 bg-dark-800" style={{ backgroundImage: 'radial-gradient(#ffffff11 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                <div className="absolute inset-x-8 top-12 bottom-32">
                    <svg className="w-full h-full text-primary-500" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M20,80 Q40,40 80,20" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="5,5" className="animate-pulse" />
                    </svg>
                </div>
                {/* Pick up marker */}
                <div className="absolute bottom-28 left-8 p-3 bg-dark-900 rounded-full shadow-lg border border-primary-500/30 text-primary-500 flex items-center justify-center">
                    <MapPin size={24} />
                </div>
                {/* Drop off marker */}
                <div className="absolute top-8 right-8 p-3 bg-dark-900 rounded-full shadow-lg border border-accent-500/30 text-accent-500 flex items-center justify-center">
                    <MapPin size={24} />
                </div>

                {/* Ride Card mockup */}
                <div className="absolute bottom-0 inset-x-0 bg-dark-900 rounded-t-3xl p-6 border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
                    <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-6"></div>
                    <h3 className="text-xl font-bold mb-2">Connecting to driver...</h3>
                    <div className="flex items-center gap-4 text-gray-400">
                        <Clock size={16} /> <span>Arriving in 3 mins</span>
                    </div>
                </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Features */}
      <section className="bg-dark-800/50 py-24 relative z-10 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: <MapPin className="text-primary-500 w-8 h-8 mb-4"/>, title: 'Live Tracking', desc: 'Watch your driver arrive in real-time on our vibrant interactive map.' },
              { icon: <Shield className="text-accent-500 w-8 h-8 mb-4"/>, title: 'Safe & Secure', desc: 'Share your trip details with loved ones. Built with safety top of mind.' },
              { icon: <Clock className="text-yellow-500 w-8 h-8 mb-4"/>, title: 'Fast Pickups', desc: 'Our smart algorithm connects you to the nearest driver in seconds.' }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                className="glass p-8 rounded-2xl hover:-translate-y-2 transition-transform duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                {feature.icon}
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
