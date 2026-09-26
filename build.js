const fs = require('fs');
const path = require('path');

// Aapka poora structure yahan embed kar diya gaya hai
const treeText = `
StockSense/
│
├── frontend/                                      
│   │
│   ├── app/                                       
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   ├── page.tsx
│   │   │   │   └── page.module.css
│   │   │   │
│   │   │   ├── register/
│   │   │   │   ├── page.tsx
│   │   │   │   └── page.module.css
│   │   │   │
│   │   │   ├── forgot-password/
│   │   │   │   ├── page.tsx
│   │   │   │   └── page.module.css
│   │   │   │
│   │   │   ├── reset-password/
│   │   │   │   ├── page.tsx
│   │   │   │   └── page.module.css
│   │   │   │
│   │   │   └── callback/
│   │   │       └── route.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── page.module.css
│   │   │
│   │   ├── products/
│   │   │   ├── page.tsx
│   │   │   ├── page.module.css
│   │   │   ├── new/
│   │   │   │   ├── page.tsx
│   │   │   │   └── page.module.css
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── page.module.css
│   │   │       └── edit/
│   │   │           ├── page.tsx
│   │   │           └── page.module.css
│   │   │
│   │   ├── categories/
│   │   │   ├── page.tsx
│   │   │   └── page.module.css
│   │   │
│   │   ├── inventory/
│   │   │   ├── page.tsx
│   │   │   ├── page.module.css
│   │   │   └── [productId]/
│   │   │       ├── page.tsx
│   │   │       └── page.module.css
│   │   │
│   │   ├── receipts/
│   │   │   ├── page.tsx
│   │   │   ├── page.module.css
│   │   │   ├── new/
│   │   │   │   ├── page.tsx
│   │   │   │   └── page.module.css
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── page.module.css
│   │   │
│   │   ├── deliveries/
│   │   │   ├── page.tsx
│   │   │   ├── page.module.css
│   │   │   ├── new/
│   │   │   │   ├── page.tsx
│   │   │   │   └── page.module.css
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── page.module.css
│   │   │
│   │   ├── transfers/
│   │   │   ├── page.tsx
│   │   │   ├── page.module.css
│   │   │   ├── new/
│   │   │   │   ├── page.tsx
│   │   │   │   └── page.module.css
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── page.module.css
│   │   │
│   │   ├── adjustments/
│   │   │   ├── page.tsx
│   │   │   ├── page.module.css
│   │   │   ├── new/
│   │   │   │   ├── page.tsx
│   │   │   │   └── page.module.css
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── page.module.css
│   │   │
│   │   ├── ledger/
│   │   │   ├── page.tsx
│   │   │   ├── page.module.css
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── page.module.css
│   │   │
│   │   ├── warehouses/
│   │   │   ├── page.tsx
│   │   │   ├── page.module.css
│   │   │   ├── new/
│   │   │   │   ├── page.tsx
│   │   │   │   └── page.module.css
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── page.module.css
│   │   │
│   │   ├── locations/
│   │   │   ├── page.tsx
│   │   │   ├── page.module.css
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── page.module.css
│   │   │
│   │   ├── suppliers/
│   │   │   ├── page.tsx
│   │   │   ├── page.module.css
│   │   │   ├── new/
│   │   │   │   ├── page.tsx
│   │   │   │   └── page.module.css
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── page.module.css
│   │   │
│   │   ├── alerts/
│   │   │   ├── page.tsx
│   │   │   └── page.module.css
│   │   │
│   │   ├── profile/
│   │   │   ├── page.tsx
│   │   │   └── page.module.css
│   │   │
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── page.module.css
│   │       ├── users/
│   │       │   ├── page.tsx
│   │       │   └── page.module.css
│   │       ├── roles/
│   │       │   ├── page.tsx
│   │       │   └── page.module.css
│   │       ├── permissions/
│   │       │   ├── page.tsx
│   │       │   └── page.module.css
│   │       └── warehouse/
│   │           ├── page.tsx
│   │           └── page.module.css
│   │
│   ├── components/
│   │   │
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   ├── Input.tsx
│   │   │   ├── Input.module.css
│   │   │   ├── Select.tsx
│   │   │   ├── Select.module.css
│   │   │   ├── Table.tsx
│   │   │   ├── Table.module.css
│   │   │   ├── Modal.tsx
│   │   │   ├── Modal.module.css
│   │   │   ├── Badge.tsx
│   │   │   ├── Badge.module.css
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Dropdown.module.css
│   │   │   ├── Pagination.tsx
│   │   │   ├── Pagination.module.css
│   │   │   ├── SearchInput.tsx
│   │   │   ├── SearchInput.module.css
│   │   │   ├── DatePicker.tsx
│   │   │   ├── DatePicker.module.css
│   │   │   ├── Toast.tsx
│   │   │   ├── Toast.module.css
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── ConfirmDialog.module.css
│   │   │   ├── Spinner.tsx
│   │   │   └── Spinner.module.css
│   │   │
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Sidebar.module.css
│   │   │   ├── Navbar.tsx
│   │   │   ├── Navbar.module.css
│   │   │   ├── Footer.tsx
│   │   │   ├── Footer.module.css
│   │   │   ├── Breadcrumb.tsx
│   │   │   ├── Breadcrumb.module.css
│   │   │   ├── PageHeader.tsx
│   │   │   └── PageHeader.module.css
│   │   │
│   │   ├── charts/
│   │   │   ├── StockChart.tsx
│   │   │   ├── StockChart.module.css
│   │   │   ├── InventoryTrendChart.tsx
│   │   │   ├── InventoryTrendChart.module.css
│   │   │   ├── CategoryChart.tsx
│   │   │   └── CategoryChart.module.css
│   │   │
│   │   ├── dashboard/
│   │   │   ├── KPIGrid.tsx
│   │   │   ├── KPIGrid.module.css
│   │   │   ├── StockOverview.tsx
│   │   │   ├── StockOverview.module.css
│   │   │   ├── LowStockWidget.tsx
│   │   │   ├── LowStockWidget.module.css
│   │   │   ├── OutOfStockWidget.tsx
│   │   │   ├── OutOfStockWidget.module.css
│   │   │   ├── PendingReceiptsWidget.tsx
│   │   │   ├── PendingReceiptsWidget.module.css
│   │   │   ├── PendingDeliveriesWidget.tsx
│   │   │   ├── PendingDeliveriesWidget.module.css
│   │   │   ├── TransferWidget.tsx
│   │   │   ├── TransferWidget.module.css
│   │   │   ├── DashboardFilters.tsx
│   │   │   └── DashboardFilters.module.css
│   │   │
│   │   ├── products/
│   │   │   ├── ProductTable.tsx
│   │   │   ├── ProductTable.module.css
│   │   │   ├── ProductForm.tsx
│   │   │   ├── ProductForm.module.css
│   │   │   ├── ProductDetails.tsx
│   │   │   ├── ProductDetails.module.css
│   │   │   ├── ProductFilters.tsx
│   │   │   ├── ProductFilters.module.css
│   │   │   ├── ProductSearch.tsx
│   │   │   └── ProductSearch.module.css
│   │   │
│   │   ├── categories/
│   │   │   ├── CategoryTable.tsx
│   │   │   ├── CategoryTable.module.css
│   │   │   ├── CategoryForm.tsx
│   │   │   └── CategoryForm.module.css
│   │   │
│   │   ├── inventory/
│   │   │   ├── InventoryTable.tsx
│   │   │   ├── InventoryTable.module.css
│   │   │   ├── InventoryFilters.tsx
│   │   │   ├── InventoryFilters.module.css
│   │   │   ├── StockSummary.tsx
│   │   │   ├── StockSummary.module.css
│   │   │   ├── StockMovementHistory.tsx
│   │   │   └── StockMovementHistory.module.css
│   │   │
│   │   ├── receipts/
│   │   │   ├── ReceiptTable.tsx
│   │   │   ├── ReceiptTable.module.css
│   │   │   ├── ReceiptForm.tsx
│   │   │   ├── ReceiptForm.module.css
│   │   │   ├── ReceiptItems.tsx
│   │   │   ├── ReceiptItems.module.css
│   │   │   ├── SupplierSelector.tsx
│   │   │   ├── SupplierSelector.module.css
│   │   │   ├── ReceiptStatusBadge.tsx
│   │   │   └── ReceiptStatusBadge.module.css
│   │   │
│   │   ├── deliveries/
│   │   │   ├── DeliveryTable.tsx
│   │   │   ├── DeliveryTable.module.css
│   │   │   ├── DeliveryForm.tsx
│   │   │   ├── DeliveryForm.module.css
│   │   │   ├── DeliveryItems.tsx
│   │   │   ├── DeliveryItems.module.css
│   │   │   ├── PickPackPanel.tsx
│   │   │   ├── PickPackPanel.module.css
│   │   │   ├── DeliveryStatusBadge.tsx
│   │   │   └── DeliveryStatusBadge.module.css
│   │   │
│   │   ├── transfers/
│   │   │   ├── TransferTable.tsx
│   │   │   ├── TransferTable.module.css
│   │   │   ├── TransferForm.tsx
│   │   │   ├── TransferForm.module.css
│   │   │   ├── TransferItems.tsx
│   │   │   ├── TransferItems.module.css
│   │   │   ├── LocationSelector.tsx
│   │   │   ├── LocationSelector.module.css
│   │   │   ├── TransferStatusBadge.tsx
│   │   │   └── TransferStatusBadge.module.css
│   │   │
│   │   ├── adjustments/
│   │   │   ├── AdjustmentTable.tsx
│   │   │   ├── AdjustmentTable.module.css
│   │   │   ├── AdjustmentForm.tsx
│   │   │   ├── AdjustmentForm.module.css
│   │   │   ├── StockDifference.tsx
│   │   │   ├── StockDifference.module.css
│   │   │   ├── AdjustmentStatusBadge.tsx
│   │   │   └── AdjustmentStatusBadge.module.css
│   │   │
│   │   ├── ledger/
│   │   │   ├── LedgerTable.tsx
│   │   │   ├── LedgerTable.module.css
│   │   │   ├── LedgerFilters.tsx
│   │   │   ├── LedgerFilters.module.css
│   │   │   ├── MovementDetails.tsx
│   │   │   └── MovementDetails.module.css
│   │   │
│   │   ├── warehouses/
│   │   │   ├── WarehouseTable.tsx
│   │   │   ├── WarehouseTable.module.css
│   │   │   ├── WarehouseForm.tsx
│   │   │   ├── WarehouseForm.module.css
│   │   │   ├── LocationTree.tsx
│   │   │   ├── LocationTree.module.css
│   │   │   ├── WarehouseStock.tsx
│   │   │   └── WarehouseStock.module.css
│   │   │
│   │   ├── locations/
│   │   │   ├── LocationTable.tsx
│   │   │   ├── LocationTable.module.css
│   │   │   ├── LocationForm.tsx
│   │   │   ├── LocationForm.module.css
│   │   │   └── LocationDetails.tsx
│   │   │
│   │   ├── suppliers/
│   │   │   ├── SupplierTable.tsx
│   │   │   ├── SupplierTable.module.css
│   │   │   ├── SupplierForm.tsx
│   │   │   ├── SupplierForm.module.css
│   │   │   ├── SupplierDetails.tsx
│   │   │   └── SupplierDetails.module.css
│   │   │
│   │   ├── alerts/
│   │   │   ├── AlertTable.tsx
│   │   │   ├── AlertTable.module.css
│   │   │   ├── LowStockAlert.tsx
│   │   │   ├── LowStockAlert.module.css
│   │   │   ├── OutOfStockAlert.tsx
│   │   │   ├── OutOfStockAlert.module.css
│   │   │   ├── AlertFilters.tsx
│   │   │   └── AlertFilters.module.css
│   │   │
│   │   ├── profile/
│   │   │   ├── ProfileForm.tsx
│   │   │   ├── ProfileForm.module.css
│   │   │   ├── AvatarUpload.tsx
│   │   │   ├── AvatarUpload.module.css
│   │   │   ├── SecuritySettings.tsx
│   │   │   └── SecuritySettings.module.css
│   │   │
│   │   ├── settings/
│   │   │   ├── UserTable.tsx
│   │   │   ├── UserTable.module.css
│   │   │   ├── RoleTable.tsx
│   │   │   ├── RoleTable.module.css
│   │   │   ├── PermissionTable.tsx
│   │   │   ├── PermissionTable.module.css
│   │   │   ├── WarehouseSettings.tsx
│   │   │   └── WarehouseSettings.module.css
│   │   │
│   │   └── common/
│   │       ├── EmptyState.tsx
│   │       ├── EmptyState.module.css
│   │       ├── ErrorState.tsx
│   │       ├── ErrorState.module.css
│   │       ├── LoadingState.tsx
│   │       ├── LoadingState.module.css
│   │       ├── StatusBadge.tsx
│   │       └── StatusBadge.module.css
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   ├── reset.css
│   │   ├── variables.css
│   │   ├── typography.css
│   │   ├── animations.css
│   │   └── themes.css
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── auth.ts
│   │   │
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── products.ts
│   │   │   ├── categories.ts
│   │   │   ├── inventory.ts
│   │   │   ├── receipts.ts
│   │   │   ├── deliveries.ts
│   │   │   ├── transfers.ts
│   │   │   ├── adjustments.ts
│   │   │   ├── ledger.ts
│   │   │   ├── warehouses.ts
│   │   │   ├── locations.ts
│   │   │   ├── suppliers.ts
│   │   │   ├── alerts.ts
│   │   │   └── profile.ts
│   │   │
│   │   ├── validation/
│   │   │   ├── auth.schema.ts
│   │   │   ├── product.schema.ts
│   │   │   ├── category.schema.ts
│   │   │   ├── receipt.schema.ts
│   │   │   ├── delivery.schema.ts
│   │   │   ├── transfer.schema.ts
│   │   │   ├── adjustment.schema.ts
│   │   │   └── profile.schema.ts
│   │   │
│   │   ├── constants/
│   │   │   ├── routes.ts
│   │   │   ├── statuses.ts
│   │   │   ├── roles.ts
│   │   │   ├── permissions.ts
│   │   │   └── movementTypes.ts
│   │   │
│   │   └── utils/
│   │       ├── dates.ts
│   │       ├── sku.ts
│   │       ├── filters.ts
│   │       └── errors.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProducts.ts
│   │   ├── useInventory.ts
│   │   ├── useReceipts.ts
│   │   ├── useDeliveries.ts
│   │   ├── useTransfers.ts
│   │   ├── useAdjustments.ts
│   │   ├── useLedger.ts
│   │   ├── useWarehouses.ts
│   │   ├── useAlerts.ts
│   │   └── useRealtime.ts
│   │
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── inventoryStore.ts
│   │   ├── filterStore.ts
│   │   └── uiStore.ts
│   │
│   ├── public/
│   │   ├── images/
│   │   │   ├── logo.svg
│   │   │   └── illustrations/
│   │   ├── icons/
│   │   └── favicon.ico
│   │
│   ├── middleware.ts
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   ├── postcss.config.mjs
│   └── package.json
│
│
├── backend/
│   │
│   ├── fastapi/                                  
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── config.py
│   │   │   ├── dependencies.py
│   │   │   │
│   │   │   ├── api/
│   │   │   │   └── v1/
│   │   │   │       ├── router.py
│   │   │   │       ├── dashboard.py
│   │   │   │       ├── products.py
│   │   │   │       ├── categories.py
│   │   │   │       ├── inventory.py
│   │   │   │       ├── receipts.py
│   │   │   │       ├── deliveries.py
│   │   │   │       ├── transfers.py
│   │   │   │       ├── adjustments.py
│   │   │   │       ├── ledger.py
│   │   │   │       ├── warehouses.py
│   │   │   │       ├── locations.py
│   │   │   │       ├── suppliers.py
│   │   │   │       ├── alerts.py
│   │   │   │       └── profile.py
│   │   │   │
│   │   │   ├── schemas/
│   │   │   │   ├── dashboard.py
│   │   │   │   ├── product.py
│   │   │   │   ├── category.py
│   │   │   │   ├── inventory.py
│   │   │   │   ├── receipt.py
│   │   │   │   ├── delivery.py
│   │   │   │   ├── transfer.py
│   │   │   │   ├── adjustment.py
│   │   │   │   ├── warehouse.py
│   │   │   │   ├── location.py
│   │   │   │   ├── supplier.py
│   │   │   │   ├── ledger.py
│   │   │   │   └── alert.py
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── dashboard_service.py
│   │   │   │   ├── product_service.py
│   │   │   │   ├── category_service.py
│   │   │   │   ├── inventory_service.py
│   │   │   │   ├── receipt_service.py
│   │   │   │   ├── delivery_service.py
│   │   │   │   ├── transfer_service.py
│   │   │   │   ├── adjustment_service.py
│   │   │   │   ├── ledger_service.py
│   │   │   │   ├── warehouse_service.py
│   │   │   │   ├── location_service.py
│   │   │   │   ├── supplier_service.py
│   │   │   │   └── alert_service.py
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   ├── product_repository.py
│   │   │   │   ├── category_repository.py
│   │   │   │   ├── inventory_repository.py
│   │   │   │   ├── receipt_repository.py
│   │   │   │   ├── delivery_repository.py
│   │   │   │   ├── transfer_repository.py
│   │   │   │   ├── adjustment_repository.py
│   │   │   │   ├── ledger_repository.py
│   │   │   │   ├── warehouse_repository.py
│   │   │   │   ├── location_repository.py
│   │   │   │   └── supplier_repository.py
│   │   │   │
│   │   │   ├── integrations/
│   │   │   │   ├── supabase_client.py
│   │   │   │   └── storage_client.py
│   │   │   │
│   │   │   ├── security/
│   │   │   │   ├── auth.py
│   │   │   │   ├── roles.py
│   │   │   │   └── permissions.py
│   │   │   │
│   │   │   ├── core/
│   │   │   │   ├── exceptions.py
│   │   │   │   ├── logging.py
│   │   │   │   └── responses.py
│   │   │   │
│   │   │   └── utils/
│   │   │       ├── sku.py
│   │   │       ├── filters.py
│   │   │       └── pagination.py
│   │   │
│   │   ├── requirements.txt
│   │   ├── pyproject.toml
│   │   ├── Dockerfile
│   │   └── .env.example
│   │
│   └── node-worker/                                
│       ├── src/
│       │   ├── index.ts
│       │   │
│       │   ├── jobs/
│       │   │   ├── reportJob.ts
│       │   │   ├── cleanupJob.ts
│       │   │   └── notificationRetryJob.ts
│       │   │
│       │   ├── services/
│       │   │   ├── reportService.ts
│       │   │   ├── notificationService.ts
│       │   │   └── cleanupService.ts
│       │   │
│       │   ├── integrations/
│       │   │   ├── supabase.ts
│       │   │   └── email.ts
│       │   │
│       │   ├── config/
│       │   │   └── env.ts
│       │   │
│       │   └── utils/
│       │       ├── logger.ts
│       │       └── errors.ts
│       │
│       ├── package.json
│       ├── tsconfig.json
│       ├── Dockerfile
│       └── .env.example
│
│
├── database/                                     
│   │
│   ├── schema/
│   │   ├── erd.md
│   │   ├── tables.md
│   │   └── relationships.md
│   │
│   ├── flows/
│   │   ├── receive-stock.md
│   │   ├── deliver-stock.md
│   │   ├── transfer-stock.md
│   │   ├── adjust-stock.md
│   │   └── ledger-flow.md
│   │
│   ├── policies/
│   │   ├── authentication.md
│   │   ├── authorization.md
│   │   └── rls-rules.md
│   │
│   └── seeds/
│       └── seed-plan.md
│
│
├── supabase/                                     
│   │
│   ├── config.toml
│   │
│   ├── migrations/
│   │   ├── <timestamp>_initial_schema.sql
│   │   ├── <timestamp>_profiles_roles.sql
│   │   ├── <timestamp>_categories_products.sql
│   │   ├── <timestamp>_warehouses_locations.sql
│   │   ├── <timestamp>_inventory.sql
│   │   ├── <timestamp>_suppliers.sql
│   │   ├── <timestamp>_receipts.sql
│   │   ├── <timestamp>_deliveries.sql
│   │   ├── <timestamp>_transfers.sql
│   │   ├── <timestamp>_adjustments.sql
│   │   ├── <timestamp>_stock_ledger.sql
│   │   ├── <timestamp>_reorder_rules.sql
│   │   ├── <timestamp>_audit_logs.sql
│   │   ├── <timestamp>_alerts.sql
│   │   ├── <timestamp>_functions.sql
│   │   ├── <timestamp>_triggers.sql
│   │   ├── <timestamp>_rls_policies.sql
│   │   └── <timestamp>_storage_policies.sql
│   │
│   ├── functions/                                
│   │   ├── inventory-webhook/
│   │   │   └── index.ts
│   │   └── low-stock-alert/
│   │       └── index.ts
│   │
│   └── seed.sql
│
│
├── shared/                                       
│   │
│   ├── generated/
│   │   └── database.types.ts
│   │
│   ├── types/
│   │   ├── auth.ts
│   │   ├── product.ts
│   │   ├── category.ts
│   │   ├── inventory.ts
│   │   ├── receipt.ts
│   │   ├── delivery.ts
│   │   ├── transfer.ts
│   │   ├── adjustment.ts
│   │   ├── warehouse.ts
│   │   ├── location.ts
│   │   ├── supplier.ts
│   │   ├── ledger.ts
│   │   ├── alert.ts
│   │   └── api.ts
│   │
│   ├── constants/
│   │   ├── roles.ts
│   │   ├── permissions.ts
│   │   ├── statuses.ts
│   │   └── movementTypes.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
│
├── tests/                                        
│   │
│   ├── unit/
│   │   ├── frontend/
│   │   │   ├── ProductForm.test.tsx
│   │   │   ├── ReceiptForm.test.tsx
│   │   │   ├── DeliveryForm.test.tsx
│   │   │   ├── TransferForm.test.tsx
│   │   │   └── InventoryTable.test.tsx
│   │   │
│   │   └── backend/
│   │       ├── test_product_service.py
│   │       ├── test_inventory_service.py
│   │       ├── test_receipt_service.py
│   │       ├── test_delivery_service.py
│   │       ├── test_transfer_service.py
│   │       └── test_adjustment_service.py
│   │
│   ├── integration/
│   │   ├── test_inventory_flow.py
│   │   ├── test_receipt_flow.py
│   │   ├── test_delivery_flow.py
│   │   ├── test_transfer_flow.py
│   │   └── test_adjustment_flow.py
│   │
│   └── e2e/
│       ├── auth.spec.ts
│       ├── dashboard.spec.ts
│       ├── products.spec.ts
│       ├── inventory.spec.ts
│       ├── receipts.spec.ts
│       ├── deliveries.spec.ts
│       ├── transfers.spec.ts
│       ├── adjustments.spec.ts
│       └── ledger.spec.ts
│
│
├── scripts/
│   ├── setup.sh
│   ├── setup.ps1
│   ├── dev.sh
│   ├── dev.ps1
│   ├── generate-types.sh
│   ├── seed-db.sh
│   ├── reset-db.sh
│   └── test-all.sh
│
│
├── docs/
│   ├── architecture.md
│   ├── frontend.md
│   ├── backend.md
│   ├── database.md
│   ├── api.md
│   ├── authentication.md
│   ├── authorization.md
│   ├── rls.md
│   ├── storage.md
│   ├── realtime.md
│   ├── stock-flow.md
│   ├── testing.md
│   ├── deployment.md
│   └── contributing.md
│
│
├── .github/
│   ├── workflows/
│   │   ├── frontend-ci.yml
│   │   ├── backend-ci.yml
│   │   ├── database-check.yml
│   │   ├── tests.yml
│   │   └── deploy.yml
│   │
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   │
│   └── pull_request_template.md
│
│
├── .gitignore
├── .env.example
├── docker-compose.yml
├── Makefile
├── package.json
├── README.md
└── LICENSE
`;

const lines = treeText.split('\n');
let stack = [];

console.log("🚀 StockSense project structure build hona shuru ho gaya hai...");

lines.forEach(line => {
    if (!line.trim()) return;

    // Normalize formatting
    const normalizedLine = line.replace(/\t/g, '    ').replace(/\u00A0/g, ' ');
    const withoutComment = normalizedLine.split('#')[0];
    
    // Extract file/folder name (FIXED REGEX HERE)
    const match = withoutComment.match(/([a-zA-Z0-9_.()[\]<>-]+)\/?/);
    if (!match) return;

    const nameWithSlash = match[0];
    const isFolder = nameWithSlash.endsWith('/') || withoutComment.trim().endsWith('/');
    const cleanName = nameWithSlash.replace('/', '');

    // Calculate depth
    const nameIndex = withoutComment.indexOf(match[0]);
    const depth = Math.floor(nameIndex / 4);

    stack[depth] = cleanName;
    stack = stack.slice(0, depth + 1);

    const fullPath = path.join(process.cwd(), ...stack);

    try {
        if (isFolder) {
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
            }
        } else {
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            if (!fs.existsSync(fullPath)) {
                fs.writeFileSync(fullPath, '');
            }
        }
    } catch (err) {
        console.error(`❌ Error in ${fullPath}:`, err.message);
    }
});

console.log("✅ Badhai ho! Poora StockSense structure ready hai. Happy Coding! 💻");