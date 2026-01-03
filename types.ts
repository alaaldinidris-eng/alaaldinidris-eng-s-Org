
export enum DonationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface Campaign {
  id: string;
  tree_price: number;
  goal_trees: number;
  trees_approved: number;
  qr_image_url: string;
  title: string;
  description: string;
}

export interface Donation {
  id: string;
  tree_quantity: number;
  amount: number;
  receipt_url: string;
  status: DonationStatus;
  created_at: string;
  donor_name?: string;
}

export interface Stats {
  totalTrees: number;
  totalAmount: number;
  pendingTrees: number;
  goalTrees: number;
}
