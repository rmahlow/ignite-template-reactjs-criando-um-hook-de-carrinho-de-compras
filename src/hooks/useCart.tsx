import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
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
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      var productExist = cart.filter(product => product.id == productId);
      if (productExist.length === 0) {
        await AddnewProductCart(productId);
      }
      else {
        var productUpdate = {
          productId,
          amount: productExist[0].amount + 1
        }
        updateProductAmount(productUpdate)
      }



    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  async function AddnewProductCart(productId: number) {
    const product = await api.get<Product>('/products/' + productId).then(response => response.data)
    product.amount = 1
    const newCart = [...cart, product];
    localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    setCart(newCart);
  }


  const removeProduct = (productId: number) => {
    try {
      var newCart = cart.filter(item => item.id != productId);      

      if(newCart.length == cart.length)
        throw new Error();

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart))
      setCart(newCart);     

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if (amount <= 0) return

      if (await isStock(productId, amount)) {
        var newCart = cart.map(item => {
          if (item.id === productId)
            return {
              ...item,
              amount: amount
            }
          else {
            return item;
          }
        })
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        setCart(newCart);

      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  async function isStock(productid: number, amount: number) {

    const productStock = await api.get<Stock>('stock/' + productid).then(response => response.data);    
    if (productStock.amount >= amount)
      return true;
    else
      return false;
  }

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
