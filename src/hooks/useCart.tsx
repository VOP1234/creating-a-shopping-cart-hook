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
      const { data } = await api.get<Stock>(`/stock/${productId}`)
      const stock = data.amount

      if (stock < 1) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const findProduct = cart.find(product => {
        return productId == product.id
      })

      if (findProduct) {
        const { data } = await api.get<Stock>(`/stock/${productId}`)
        const stock = data.amount

        if (stock <= findProduct.amount + 1) {
          toast.error('Quantidade solicitada fora de estoque');
          return
        }

        updateProductAmount({
          productId: findProduct.id,
          amount: findProduct.amount + 1
        })

      } else {
        const { data } = await api.get<Product>(`/products/${productId}`)
        const {
          id,
          image,
          price,
          title,
          amount = 1
        } = data

        if (stock < 1 || amount > stock) {
          toast.error('Quantidade solicitada fora de estoque');
          return
        }

        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, {
          id,
          image,
          amount,
          price,
          title
        }]))

        setCart([...cart, {
          id,
          image,
          amount,
          price,
          title
        }])
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const findProduct = cart.find(product => {
        return productId == product.id
      })

      if (findProduct) {
        const filterProducts = cart.filter(product => {
          if (product.id !== productId) {
            return product
          }
        })

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(filterProducts))

        setCart(filterProducts)

      } else {
        toast.error('Erro na remoção do produto');
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data } = await api.get<Stock>(`/stock/${productId}`)
      const stock = data.amount

      if (stock <= amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const findProduct = cart.find(product => {
        return productId == product.id
      })

      if (findProduct) {
        const changeAmount = cart.map(product => {
          if (product.id === productId) {
            product.amount = amount
            return product
          }
          return product
        })

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(changeAmount))

        setCart(changeAmount)

      } else {
        toast.error('Erro na alteração de quantidade do produto')
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto')
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
