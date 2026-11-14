import { Category } from './Category';
import { ChatMessage } from './ChatMessage';
import { CompanySettings } from './CompanySettings';
import { Contract } from './Contract';
import { ContractService } from './ContractService';
import { Conversation } from './Conversation';
import { Customer } from './Customer';
import { Invoice } from './Invoice';
import { Notification } from './Notification';
import { Product } from './Product';
import { Service } from './Service';
import { ServiceRequest } from './ServiceRequest';
import { ServiceRequestItem } from './ServiceRequestItem';
import { ServiceRequestService } from './ServiceRequestService';
import { ServiceType } from './ServiceType';
import { StockMovement } from './StockMovement';
import { Supplier } from './Supplier';
import { User } from './User';
import { Vehicle } from './Vehicle';

export * from './enums';
export type { InvoiceLine, InvoiceParty, InvoiceReference } from './Invoice';
export {
  Category,
  ChatMessage,
  CompanySettings,
  Contract,
  ContractService,
  Conversation,
  Customer,
  Invoice,
  Notification,
  Product,
  Service,
  ServiceRequest,
  ServiceRequestItem,
  ServiceRequestService,
  ServiceType,
  StockMovement,
  Supplier,
  User,
  Vehicle,
};

// Lista explícita (sem glob) para funcionar no bundle serverless da Vercel
export const entities = [
  User,
  Category,
  Supplier,
  Product,
  StockMovement,
  Customer,
  Vehicle,
  ServiceType,
  Service,
  Contract,
  ContractService,
  ServiceRequest,
  ServiceRequestItem,
  ServiceRequestService,
  Invoice,
  CompanySettings,
  Conversation,
  ChatMessage,
  Notification,
];
