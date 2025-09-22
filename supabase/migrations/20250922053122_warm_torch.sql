/*
  # Property Verification and Market Data System

  1. New Tables
    - `property_verifications` - Track verification status and results
    - `due_diligence_checklists` - Comprehensive due diligence tracking
    - `property_mls_data` - MLS integration data storage
    - `property_market_data` - Market analysis and comparable sales
    - `verification_documents` - Document storage and tracking
    - `property_inspections` - Inspection reports and findings
    - `market_comparables` - Comparable property analysis

  2. Security
    - Enable RLS on all new tables
    - Add policies for property managers and admins
    - Restrict sensitive data access

  3. Indexes
    - Performance indexes for verification queries
    - Market data lookup optimization
*/

-- Property Verifications Table
CREATE TABLE IF NOT EXISTS property_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'in_progress', 'completed', 'failed', 'rejected')),
  requested_by uuid REFERENCES users(id),
  verified_by uuid REFERENCES users(id),
  requested_at timestamptz DEFAULT now(),
  verified_at timestamptz,
  verification_notes text,
  final_rating numeric CHECK (final_rating >= 0 AND final_rating <= 5),
  verification_score jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Due Diligence Checklists
CREATE TABLE IF NOT EXISTS due_diligence_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  title_search jsonb DEFAULT '{
    "completed": false,
    "clear_title": false,
    "liens": [],
    "encumbrances": [],
    "notes": ""
  }',
  physical_inspection jsonb DEFAULT '{
    "completed": false,
    "structural_issues": [],
    "mechanical_systems": [],
    "estimated_repairs": 0,
    "inspector_rating": 0,
    "notes": ""
  }',
  financial_analysis jsonb DEFAULT '{
    "completed": false,
    "rent_roll_verified": false,
    "expense_analysis": {},
    "cash_flow_projection": {},
    "comparable_analysis": {}
  }',
  legal_review jsonb DEFAULT '{
    "completed": false,
    "zoning_compliance": false,
    "permit_status": "pending",
    "hoa_restrictions": [],
    "legal_issues": []
  }',
  environmental_assessment jsonb DEFAULT '{
    "completed": false,
    "environmental_hazards": [],
    "remediation_required": false,
    "estimated_costs": 0
  }',
  insurance_review jsonb DEFAULT '{
    "completed": false,
    "insurability": false,
    "estimated_premium": 0,
    "coverage_requirements": []
  }',
  overall_completion_percentage numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Property MLS Data
CREATE TABLE IF NOT EXISTS property_mls_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  mls_id text NOT NULL,
  mls_source text DEFAULT 'NTREIS',
  listing_agent_name text,
  listing_agent_phone text,
  listing_agent_email text,
  listing_date date,
  listing_price numeric,
  square_feet integer,
  lot_size numeric,
  year_built integer,
  bedrooms integer,
  bathrooms numeric,
  property_subtype text,
  listing_status text DEFAULT 'active',
  days_on_market integer DEFAULT 0,
  price_per_sqft numeric,
  raw_mls_data jsonb DEFAULT '{}',
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Property Market Data
CREATE TABLE IF NOT EXISTS property_market_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  data_source text NOT NULL CHECK (data_source IN ('zillow', 'redfin', 'realtor', 'rentometer', 'internal')),
  zpid text,
  zestimate numeric,
  rent_zestimate numeric,
  price_history jsonb DEFAULT '[]',
  comparable_sales jsonb DEFAULT '[]',
  neighborhood_data jsonb DEFAULT '{}',
  market_trends jsonb DEFAULT '{}',
  walk_score integer,
  transit_score integer,
  school_ratings jsonb DEFAULT '[]',
  crime_data jsonb DEFAULT '{}',
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Verification Documents
CREATE TABLE IF NOT EXISTS verification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN (
    'title_report', 'inspection_report', 'appraisal_report', 
    'environmental_report', 'legal_opinion', 'survey', 
    'insurance_quote', 'rent_roll', 'financial_statements'
  )),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,
  uploaded_by uuid REFERENCES users(id),
  verified_by uuid REFERENCES users(id),
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verification_notes text,
  is_public boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Property Inspections
CREATE TABLE IF NOT EXISTS property_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  inspection_type text NOT NULL CHECK (inspection_type IN ('general', 'structural', 'environmental', 'pest', 'electrical', 'plumbing')),
  inspector_name text NOT NULL,
  inspector_license text,
  inspector_company text,
  inspection_date date NOT NULL,
  inspection_status text DEFAULT 'scheduled' CHECK (inspection_status IN ('scheduled', 'completed', 'cancelled', 'failed')),
  findings jsonb DEFAULT '{}',
  recommendations jsonb DEFAULT '[]',
  estimated_repair_costs numeric DEFAULT 0,
  overall_rating numeric CHECK (overall_rating >= 1 AND overall_rating <= 5),
  report_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Market Comparables
CREATE TABLE IF NOT EXISTS market_comparables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  comparable_address text NOT NULL,
  comparable_city text NOT NULL,
  comparable_state text NOT NULL,
  sale_price numeric NOT NULL,
  sale_date date NOT NULL,
  square_feet integer,
  bedrooms integer,
  bathrooms numeric,
  lot_size numeric,
  year_built integer,
  distance_miles numeric,
  price_per_sqft numeric,
  adjustment_factors jsonb DEFAULT '{}',
  adjusted_price numeric,
  data_source text DEFAULT 'mls',
  confidence_score numeric DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE property_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE due_diligence_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_mls_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_comparables ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Property Verifications
CREATE POLICY "Property managers can manage verifications"
  ON property_verifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'property_manager')
    )
  );

CREATE POLICY "Property owners can view verifications"
  ON property_verifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_verifications.property_id 
      AND properties.property_manager_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'property_manager')
    )
  );

-- RLS Policies for Due Diligence
CREATE POLICY "Property managers can manage due diligence"
  ON due_diligence_checklists
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'property_manager')
    )
  );

-- RLS Policies for MLS Data
CREATE POLICY "Anyone can view MLS data"
  ON property_mls_data
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Property managers can manage MLS data"
  ON property_mls_data
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'property_manager')
    )
  );

-- RLS Policies for Market Data
CREATE POLICY "Anyone can view market data"
  ON property_market_data
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Property managers can manage market data"
  ON property_market_data
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'property_manager')
    )
  );

-- RLS Policies for Verification Documents
CREATE POLICY "Property managers can manage verification documents"
  ON verification_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'property_manager')
    )
  );

CREATE POLICY "Anyone can view public verification documents"
  ON verification_documents
  FOR SELECT
  TO public
  USING (is_public = true);

-- RLS Policies for Inspections
CREATE POLICY "Property managers can manage inspections"
  ON property_inspections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'property_manager')
    )
  );

CREATE POLICY "Property owners can view inspections"
  ON property_inspections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_inspections.property_id 
      AND properties.property_manager_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM shares 
      WHERE shares.property_id = property_inspections.property_id 
      AND shares.user_id = auth.uid()
    )
  );

-- RLS Policies for Market Comparables
CREATE POLICY "Anyone can view market comparables"
  ON market_comparables
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Property managers can manage comparables"
  ON market_comparables
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'property_manager')
    )
  );

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_property_verifications_property_id ON property_verifications(property_id);
CREATE INDEX IF NOT EXISTS idx_property_verifications_status ON property_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_due_diligence_property_id ON due_diligence_checklists(property_id);
CREATE INDEX IF NOT EXISTS idx_mls_data_property_id ON property_mls_data(property_id);
CREATE INDEX IF NOT EXISTS idx_mls_data_mls_id ON property_mls_data(mls_id);
CREATE INDEX IF NOT EXISTS idx_market_data_property_id ON property_market_data(property_id);
CREATE INDEX IF NOT EXISTS idx_market_data_source ON property_market_data(data_source);
CREATE INDEX IF NOT EXISTS idx_verification_docs_property_id ON verification_documents(property_id);
CREATE INDEX IF NOT EXISTS idx_verification_docs_type ON verification_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_inspections_property_id ON property_inspections(property_id);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON property_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_comparables_property_id ON market_comparables(property_id);
CREATE INDEX IF NOT EXISTS idx_comparables_sale_date ON market_comparables(sale_date);

-- Functions for verification automation
CREATE OR REPLACE FUNCTION calculate_verification_completion(property_id_param uuid)
RETURNS numeric AS $$
DECLARE
  checklist_data jsonb;
  total_items integer := 6;
  completed_items integer := 0;
BEGIN
  SELECT 
    CASE WHEN (title_search->>'completed')::boolean THEN 1 ELSE 0 END +
    CASE WHEN (physical_inspection->>'completed')::boolean THEN 1 ELSE 0 END +
    CASE WHEN (financial_analysis->>'completed')::boolean THEN 1 ELSE 0 END +
    CASE WHEN (legal_review->>'completed')::boolean THEN 1 ELSE 0 END +
    CASE WHEN (environmental_assessment->>'completed')::boolean THEN 1 ELSE 0 END +
    CASE WHEN (insurance_review->>'completed')::boolean THEN 1 ELSE 0 END
  INTO completed_items
  FROM due_diligence_checklists
  WHERE property_id = property_id_param;
  
  RETURN (completed_items::numeric / total_items::numeric) * 100;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update verification completion percentage
CREATE OR REPLACE FUNCTION update_verification_completion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.overall_completion_percentage := calculate_verification_completion(NEW.property_id);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_due_diligence_completion
  BEFORE UPDATE ON due_diligence_checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_verification_completion();

-- Function to auto-approve properties when verification is complete
CREATE OR REPLACE FUNCTION check_property_verification_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- If verification is completed and all checks pass
  IF NEW.verification_status = 'completed' AND NEW.final_rating >= 4.0 THEN
    UPDATE properties 
    SET 
      status = 'active',
      rating = NEW.final_rating,
      updated_at = now()
    WHERE id = NEW.property_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_approve_verified_properties
  AFTER UPDATE ON property_verifications
  FOR EACH ROW
  EXECUTE FUNCTION check_property_verification_completion();