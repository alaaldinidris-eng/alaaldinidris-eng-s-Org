import React from 'react';
import { 
  TreeDeciduous, 
  ShieldCheck, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Settings, 
  LayoutDashboard, 
  LogOut 
} from 'lucide-react';

export const TREE_PRICE = 10;
export const DEFAULT_GOAL = 1000;

const IconStyle = "w-6 h-6";

export const ICONS = {
  Tree: <TreeDeciduous className={IconStyle} />,
  Shield: <ShieldCheck className={IconStyle} />,
  Wallet: <Wallet className={IconStyle} />,
  Clock: <Clock className={IconStyle} />,
  Check: <CheckCircle2 className={IconStyle} />,
  X: <XCircle className={IconStyle} />,
  Settings: <Settings className={IconStyle} />,
  Dashboard: <LayoutDashboard className={IconStyle} />,
  Logout: <LogOut className={IconStyle} />
};

export const MOCK_QR_CODE = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=TNG-PAYMENT-MOCK";