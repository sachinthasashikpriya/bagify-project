export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
  userType: 'buyer' | 'seller' | 'admin';
}


export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  tokenType: 'Bearer';
}

export interface Result<T> {
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
  details?: unknown;
  message?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  type: 'buyer' | 'seller' | 'admin';
}

export interface Seller extends User {
  type: 'seller';
  storeName: string;
  rating: number;
  totalReviews: number;
  joinedDate: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  sellerId: string;
  sellerName: string;
  sellerRating: number;
  stock: number;
  reviews: Review[];
  averageRating: number;
}

export interface Review {
  id: string;
  productId: string;
  buyerId: string;
  buyerName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  buyerId: string;
  products: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    image: string;
  }[];
  totalAmount: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  shippingAddress: string;
}

export const mockSellers: Seller[] = [
  {
    id: 's1',
    name: 'Sarah Johnson',
    email: 'sarah@luxebags.com',
    type: 'seller',
    phone: '+1 234 567 8901',
    address: '123 Fashion St, New York, NY',
    storeName: 'Luxe Bags Co',
    rating: 4.8,
    totalReviews: 156,
    joinedDate: '2023-01-15',
  },
  {
    id: 's2',
    name: 'Michael Chen',
    email: 'michael@urbancarry.com',
    type: 'seller',
    phone: '+1 234 567 8902',
    address: '456 Market Ave, Los Angeles, CA',
    storeName: 'Urban Carry',
    rating: 4.6,
    totalReviews: 89,
    joinedDate: '2023-03-20',
  },
  {
    id: 's3',
    name: 'Emma Davis',
    email: 'emma@craftleather.com',
    type: 'seller',
    phone: '+1 234 567 8903',
    address: '789 Craft Blvd, Austin, TX',
    storeName: 'Craft Leather Studio',
    rating: 4.9,
    totalReviews: 203,
    joinedDate: '2022-11-10',
  },
];

export const mockBuyers: User[] = [
  {
    id: 'b1',
    name: 'John Smith',
    email: 'john@email.com',
    type: 'buyer',
    phone: '+1 345 678 9001',
    address: '321 Oak St, Chicago, IL',
  },
  {
    id: 'b2',
    name: 'Lisa Anderson',
    email: 'lisa@email.com',
    type: 'buyer',
    phone: '+1 345 678 9002',
    address: '654 Pine Rd, Seattle, WA',
  },
];

export const mockReviews: Review[] = [
  {
    id: 'r1',
    productId: 'p1',
    buyerId: 'b1',
    buyerName: 'John Smith',
    rating: 5,
    comment: 'Excellent quality! The leather is soft and the stitching is perfect.',
    date: '2024-11-15',
  },
  {
    id: 'r2',
    productId: 'p1',
    buyerId: 'b2',
    buyerName: 'Lisa Anderson',
    rating: 4,
    comment: 'Beautiful bag, though slightly smaller than I expected.',
    date: '2024-11-20',
  },
  {
    id: 'r3',
    productId: 'p2',
    buyerId: 'b1',
    buyerName: 'John Smith',
    rating: 5,
    comment: 'Perfect for daily commute. Very comfortable and spacious.',
    date: '2024-11-18',
  },
];

export const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'Classic Leather Handbag',
    description: 'Elegant handcrafted leather handbag with premium finish. Features multiple compartments and adjustable strap.',
    price: 129.99,
    category: 'Handbag',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwaGFuZGJhZ3xlbnwxfHx8fDE3NjUwOTg1Mjl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    sellerId: 's1',
    sellerName: 'Luxe Bags Co',
    sellerRating: 4.8,
    stock: 15,
    reviews: mockReviews.filter(r => r.productId === 'p1'),
    averageRating: 4.5,
  },
  {
    id: 'p2',
    name: 'Urban Backpack',
    description: 'Modern backpack designed for urban professionals. Water-resistant fabric with laptop compartment.',
    price: 89.99,
    category: 'Backpack',
    image: 'https://images.unsplash.com/photo-1574271143443-3a7b2e7a36bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWNrcGFjayUyMGZhc2hpb258ZW58MXx8fHwxNzY1MjA5NjI3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    sellerId: 's2',
    sellerName: 'Urban Carry',
    sellerRating: 4.6,
    stock: 22,
    reviews: mockReviews.filter(r => r.productId === 'p2'),
    averageRating: 5.0,
  },
  {
    id: 'p3',
    name: 'Travel Duffel Bag',
    description: 'Spacious travel bag perfect for weekend getaways. Durable construction with multiple pockets.',
    price: 149.99,
    category: 'Travel Bag',
    image: 'https://images.unsplash.com/photo-1448582649076-3981753123b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBiYWd8ZW58MXx8fHwxNzY1MjEwODM3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    sellerId: 's3',
    sellerName: 'Craft Leather Studio',
    sellerRating: 4.9,
    stock: 8,
    reviews: [],
    averageRating: 0,
  },
  {
    id: 'p4',
    name: 'Canvas Tote Bag',
    description: 'Eco-friendly canvas tote bag. Perfect for shopping or daily use. Strong handles and large capacity.',
    price: 39.99,
    category: 'Tote Bag',
    image: 'https://images.unsplash.com/photo-1574365569389-a10d488ca3fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b3RlJTIwYmFnfGVufDF8fHx8MTc2NTE4NDg3NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    sellerId: 's1',
    sellerName: 'Luxe Bags Co',
    sellerRating: 4.8,
    stock: 30,
    reviews: [],
    averageRating: 0,
  },
  {
    id: 'p5',
    name: 'Messenger Bag',
    description: 'Professional messenger bag with padded shoulder strap. Ideal for carrying documents and laptop.',
    price: 99.99,
    category: 'Messenger Bag',
    image: 'https://images.unsplash.com/photo-1528976915572-6a0cf746802e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZXNzZW5nZXIlMjBiYWd8ZW58MXx8fHwxNzY1MjEwODM5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    sellerId: 's2',
    sellerName: 'Urban Carry',
    sellerRating: 4.6,
    stock: 18,
    reviews: [],
    averageRating: 0,
  },
  {
    id: 'p6',
    name: 'Designer Crossbody Purse',
    description: 'Stylish crossbody purse with gold chain strap. Premium materials and elegant design.',
    price: 179.99,
    category: 'Purse',
    image: 'https://images.unsplash.com/photo-1601924928357-22d3b3abfcfb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNpZ25lciUyMHB1cnNlfGVufDF8fHx8MTc2NTE4NTYxNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    sellerId: 's3',
    sellerName: 'Craft Leather Studio',
    sellerRating: 4.9,
    stock: 12,
    reviews: [],
    averageRating: 0,
  },
];

export const mockOrders: Order[] = [
  {
    id: 'o1',
    buyerId: 'b1',
    products: [
      {
        productId: 'p1',
        productName: 'Classic Leather Handbag',
        quantity: 1,
        price: 129.99,
        image: mockProducts[0].image,
      },
    ],
    totalAmount: 129.99,
    status: 'delivered',
    orderDate: '2024-11-10',
    shippingAddress: '321 Oak St, Chicago, IL',
  },
  {
    id: 'o2',
    buyerId: 'b1',
    products: [
      {
        productId: 'p2',
        productName: 'Urban Backpack',
        quantity: 1,
        price: 89.99,
        image: mockProducts[1].image,
      },
    ],
    totalAmount: 89.99,
    status: 'shipped',
    orderDate: '2024-12-01',
    shippingAddress: '321 Oak St, Chicago, IL',
  },
];
