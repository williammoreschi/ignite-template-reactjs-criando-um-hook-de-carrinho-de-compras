import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

 const addProduct = async (productId: number) => {
   try {
     const foundProduct = cart.find(product => product.id === productId);
     if(foundProduct){
       const amount = foundProduct.amount+1;
       updateProductAmount({productId,amount});
     }else{
       const addingProduct = await api.get<Product>(`products/${productId}`).then(response => response.data);
       const newCart = [...cart,{...addingProduct,amount:1}];
       setCart(newCart);
       localStorage.setItem('@RocketShoes:cart',JSON.stringify(newCart));
     }
   } catch {
     toast.error('Erro na adição do produto');
   }
 };

  

  const removeProduct = (productId: number) => {
    try {
      const ProductIndex = cart.findIndex(product => product.id === productId);
      if(ProductIndex === -1){
        toast.error('Erro na remoção do produto');
        return;
      }
      const CartUpdate = cart.filter(product => product.id !== productId);
      setCart(CartUpdate);
      localStorage.setItem('@RocketShoes:cart',JSON.stringify(CartUpdate));
      //cart.splice(ProductIndex,1);
      //setCart([...cart]);
      //localStorage.setItem('@RocketShoes:cart',JSON.stringify([...cart]));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount < 1) return;
      const ProductIndex = cart.findIndex(product => product.id === productId);
      const foundProduct = cart.find(product => product.id === productId);
      if(!foundProduct){
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }
      const foundProductStock = await api.get<Stock>(`stock/${productId}`).then(response => response.data); 
      if(amount > foundProductStock.amount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      cart[ProductIndex].amount = amount;
      setCart([...cart]); 
      localStorage.setItem('@RocketShoes:cart',JSON.stringify([...cart]));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
