@@ .. @@
 import { Heart, TrendingUp, MapPin, Star } from 'lucide-react';
 import { Property } from '../lib/mockData';
+import { useWallet } from '../lib/wallet';
 import { motion } from 'framer-motion';

 interface PropertyCardProps {
@@ .. @@

 export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onInvest }) => {
+  const { isConnected } = useWallet();
   const [isLiked, setIsLiked] = React.useState(false);

@@ .. @@
         <button
           onClick={() => onInvest?.(property.id)}
-          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
+          className={`w-full py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
+            isConnected 
+              ? 'bg-blue-600 text-white hover:bg-blue-700' 
+              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
+          }`}
         >
           <TrendingUp className="h-4 w-4" />
-          <span>Invest Now</span>
+          <span>{isConnected ? 'Invest Now' : 'Connect Wallet'}</span>
         </button>
       </div>
     </motion.div>