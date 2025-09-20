/*
  # Add Performance Indexes

  1. Database Optimization
    - Add indexes on frequently queried columns
    - Improve query performance for properties, users, and transactions
    - Add composite indexes for common filter combinations

  2. Index Details
    - Properties: status, property_type, location, created_at
    - Users: email, role, kyc_status, is_active
    - Transactions: user_id, status, transaction_type, created_at
    - Shares: user_id, property_id, is_active

  3. Performance Impact
    - Faster property marketplace loading
    - Improved user authentication
    - Quicker transaction history queries
*/

-- Properties table indexes for marketplace performance
CREATE INDEX IF NOT EXISTS idx_properties_status_created_at ON properties(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_type_status ON properties(property_type, status);
CREATE INDEX IF NOT EXISTS idx_properties_location_status ON properties(location, status);
CREATE INDEX IF NOT EXISTS idx_properties_yield_status ON properties(rental_yield, status);
CREATE INDEX IF NOT EXISTS idx_properties_price_status ON properties(price_per_token, status);

-- Users table indexes for authentication performance
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active);
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);
CREATE INDEX IF NOT EXISTS idx_users_kyc_active ON users(kyc_status, is_active);

-- Transactions table indexes for history queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_status ON transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_property_created ON transactions(property_id, created_at DESC);

-- Shares table indexes for portfolio queries
CREATE INDEX IF NOT EXISTS idx_shares_user_active ON shares(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_shares_property_active ON shares(property_id, is_active);
CREATE INDEX IF NOT EXISTS idx_shares_user_property_active ON shares(user_id, property_id, is_active);

-- Staking pools indexes
CREATE INDEX IF NOT EXISTS idx_staking_pools_active_apy ON staking_pools(is_active, apy DESC);

-- User stakes indexes
CREATE INDEX IF NOT EXISTS idx_user_stakes_user_active ON user_stakes(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_stakes_pool_active ON user_stakes(pool_id, is_active);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Rentals indexes
CREATE INDEX IF NOT EXISTS idx_rentals_property_month ON rentals(property_id, month_year DESC);

-- Analyze tables to update statistics
ANALYZE properties;
ANALYZE users;
ANALYZE transactions;
ANALYZE shares;
ANALYZE staking_pools;
ANALYZE user_stakes;
ANALYZE notifications;
ANALYZE rentals;