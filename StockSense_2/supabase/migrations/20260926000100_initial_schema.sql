extension if not exists pgcrypto;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name in ('admin','manager','staff')),
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  address text,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role_id uuid references public.roles(id),
  warehouse_id uuid references public.warehouses(id),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null unique,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  unit text not null default 'pcs',
  unit_cost numeric(14,2) not null default 0 check (unit_cost >= 0),
  reorder_level numeric(14,3) not null default 0 check (reorder_level >= 0),
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  name text not null,
  code text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (warehouse_id, code)
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  address text,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  quantity numeric(14,3) not null default 0,
  reserved_quantity numeric(14,3) not null default 0 check (reserved_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, warehouse_id, location_id),
  check (quantity >= 0)
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  supplier_id uuid references public.suppliers(id) on delete set null,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  status text not null default 'draft',
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.receipts(id) on delete cascade,
  product_id uuid not null references public.products(id),
  location_id uuid references public.locations(id),
  quantity numeric(14,3) not null check (quantity > 0),
  unit_cost numeric(14,2) not null default 0 check (unit_cost >= 0)
);

create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  status text not null default 'draft',
  recipient_name text,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_items (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  product_id uuid not null references public.products(id),
  location_id uuid references public.locations(id),
  quantity numeric(14,3) not null check (quantity > 0)
);

create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  source_warehouse_id uuid references public.warehouses(id),
  destination_warehouse_id uuid references public.warehouses(id),
  status text not null default 'draft',
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transfer_items (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid not null references public.transfers(id) on delete cascade,
  product_id uuid not null references public.products(id),
  source_location_id uuid references public.locations(id),
  destination_location_id uuid references public.locations(id),
  quantity numeric(14,3) not null check (quantity > 0)
);

create table if not exists public.adjustments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  product_id uuid references public.products(id),
  warehouse_id uuid references public.warehouses(id),
  location_id uuid references public.locations(id),
  quantity_delta numeric(14,3) not null,
  reason text,
  status text not null default 'posted',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ledger (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  warehouse_id uuid references public.warehouses(id),
  location_id uuid references public.locations(id),
  movement_type text not null,
  quantity_delta numeric(14,3) not null,
  balance_after numeric(14,3) not null default 0,
  reference_type text,
  reference_id uuid,
  actor_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  message text,
  product_id uuid references public.products(id) on delete cascade,
  warehouse_id uuid references public.warehouses(id) on delete cascade,
  is_read boolean not null default false,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_product on public.inventory(product_id);
create index if not exists idx_inventory_warehouse on public.inventory(warehouse_id);
create index if not exists idx_inventory_location on public.inventory(location_id);
create index if not exists idx_ledger_product_created on public.ledger(product_id, created_at desc);
create index if not exists idx_alerts_unread on public.alerts(is_read, created_at desc);

insert into public.roles(name) values ('admin'),('manager'),('staff') on conflict (name) do nothing;

insert into public.permissions(code) values
('dashboard.read'),('products.read'),('products.write'),('categories.read'),('categories.write'),
('inventory.read'),('receipts.read'),('receipts.write'),('deliveries.read'),('deliveries.write'),
('transfers.read'),('transfers.write'),('adjustments.read'),('adjustments.write'),('ledger.read'),
('warehouses.read'),('warehouses.write'),('locations.read'),('locations.write'),('suppliers.read'),
('suppliers.write'),('alerts.read'),('profile.read'),('profile.write'),('settings.read'),('settings.write')
on conflict (code) do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p where r.name='admin'
on conflict do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id from public.roles r join public.permissions p on p.code in (
'dashboard.read','products.read','products.write','categories.read','categories.write','inventory.read',
'receipts.read','receipts.write','deliveries.read','deliveries.write','transfers.read','transfers.write',
'adjustments.read','adjustments.write','ledger.read','warehouses.read','warehouses.write','locations.read',
'locations.write','suppliers.read','suppliers.write','alerts.read','profile.read','profile.write','settings.read','settings.write'
) where r.name='manager' on conflict do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id from public.roles r join public.permissions p on p.code in (
'dashboard.read','products.read','categories.read','inventory.read','receipts.read','receipts.write',
'deliveries.read','deliveries.write','transfers.read','transfers.write','adjustments.read','ledger.read',
'warehouses.read','locations.read','suppliers.read','alerts.read','profile.read','profile.write'
) where r.name='staff' on conflict do nothing;

create or replace function public.receive_stock(p_payload jsonb, p_actor_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_product uuid := (p_payload->>'product_id')::uuid; v_warehouse uuid := (p_payload->>'warehouse_id')::uuid; v_location uuid := (p_payload->>'location_id')::uuid; v_qty numeric := (p_payload->>'quantity')::numeric; v_row inventory%rowtype;
begin
 if v_qty is null or v_qty <= 0 then raise exception 'quantity must be greater than zero'; end if;
 insert into inventory(product_id,warehouse_id,location_id,quantity) values(v_product,v_warehouse,v_location,v_qty)
 on conflict(product_id,warehouse_id,location_id) do update set quantity=inventory.quantity+excluded.quantity,updated_at=now()
 returning * into v_row;
 insert into ledger(product_id,warehouse_id,location_id,movement_type,quantity_delta,balance_after,reference_type,reference_id,actor_id,metadata)
 values(v_product,v_warehouse,v_location,'receive',v_qty,v_row.quantity,p_payload->>'reference_type',null,p_actor_id,p_payload);
 return jsonb_build_object('inventory_id',v_row.id,'quantity',v_row.quantity,'operation','receive');
end $$;

create or replace function public.deliver_stock(p_payload jsonb, p_actor_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_product uuid := (p_payload->>'product_id')::uuid; v_warehouse uuid := (p_payload->>'warehouse_id')::uuid; v_location uuid := (p_payload->>'location_id')::uuid; v_qty numeric := (p_payload->>'quantity')::numeric; v_row inventory%rowtype; v_new numeric;
begin
 if v_qty is null or v_qty <= 0 then raise exception 'quantity must be greater than zero'; end if;
 select * into v_row from inventory where product_id=v_product and warehouse_id=v_warehouse and location_id=v_location for update;
 if not found then raise exception 'inventory row not found'; end if;
 v_new := v_row.quantity-v_qty;
 if v_new < 0 then raise exception 'insufficient stock'; end if;
 update inventory set quantity=v_new,updated_at=now() where id=v_row.id returning * into v_row;
 insert into ledger(product_id,warehouse_id,location_id,movement_type,quantity_delta,balance_after,reference_type,reference_id,actor_id,metadata)
 values(v_product,v_warehouse,v_location,'delivery',-v_qty,v_row.quantity,p_payload->>'reference_type',null,p_actor_id,p_payload);
 return jsonb_build_object('inventory_id',v_row.id,'quantity',v_row.quantity,'operation','deliver');
end $$;

create or replace function public.adjust_stock(p_payload jsonb, p_actor_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_product uuid := (p_payload->>'product_id')::uuid; v_warehouse uuid := (p_payload->>'warehouse_id')::uuid; v_location uuid := (p_payload->>'location_id')::uuid; v_delta numeric := (p_payload->>'quantity_delta')::numeric; v_row inventory%rowtype; v_new numeric;
begin
 if v_delta is null then raise exception 'quantity_delta is required'; end if;
 insert into inventory(product_id,warehouse_id,location_id,quantity) values(v_product,v_warehouse,v_location,greatest(v_delta,0))
 on conflict(product_id,warehouse_id,location_id) do nothing;
 select * into v_row from inventory where product_id=v_product and warehouse_id=v_warehouse and location_id=v_location for update;
 v_new:=v_row.quantity+v_delta; if v_new<0 then raise exception 'adjustment would make stock negative'; end if;
 update inventory set quantity=v_new,updated_at=now() where id=v_row.id returning * into v_row;
 insert into ledger(product_id,warehouse_id,location_id,movement_type,quantity_delta,balance_after,actor_id,metadata)
 values(v_product,v_warehouse,v_location,'adjustment',v_delta,v_row.quantity,p_actor_id,p_payload);
 return jsonb_build_object('inventory_id',v_row.id,'quantity',v_row.quantity,'operation','adjust');
end $$;

create or replace function public.transfer_stock(p_payload jsonb, p_actor_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_product uuid := (p_payload->>'product_id')::uuid; v_source_wh uuid := (p_payload->>'source_warehouse_id')::uuid; v_dest_wh uuid := (p_payload->>'destination_warehouse_id')::uuid; v_source_loc uuid := (p_payload->>'source_location_id')::uuid; v_dest_loc uuid := (p_payload->>'destination_location_id')::uuid; v_qty numeric := (p_payload->>'quantity')::numeric; v_src inventory%rowtype; v_dst inventory%rowtype; v_new numeric;
begin
 if v_qty is null or v_qty<=0 then raise exception 'quantity must be greater than zero'; end if;
 select * into v_src from inventory where product_id=v_product and warehouse_id=v_source_wh and location_id=v_source_loc for update;
 if not found or v_src.quantity<v_qty then raise exception 'insufficient source stock'; end if;
 update inventory set quantity=quantity-v_qty,updated_at=now() where id=v_src.id returning * into v_src;
 insert into inventory(product_id,warehouse_id,location_id,quantity) values(v_product,v_dest_wh,v_dest_loc,v_qty)
 on conflict(product_id,warehouse_id,location_id) do update set quantity=inventory.quantity+excluded.quantity,updated_at=now()
 returning * into v_dst;
 insert into ledger(product_id,warehouse_id,location_id,movement_type,quantity_delta,balance_after,actor_id,metadata) values(v_product,v_source_wh,v_source_loc,'transfer_out',-v_qty,v_src.quantity,p_actor_id,p_payload);
 insert into ledger(product_id,warehouse_id,location_id,movement_type,quantity_delta,balance_after,actor_id,metadata) values(v_product,v_dest_wh,v_dest_loc,'transfer_in',v_qty,v_dst.quantity,p_actor_id,p_payload);
 return jsonb_build_object('source_inventory_id',v_src.id,'destination_inventory_id',v_dst.id,'source_quantity',v_src.quantity,'destination_quantity',v_dst.quantity,'operation','transfer');
end $$;
