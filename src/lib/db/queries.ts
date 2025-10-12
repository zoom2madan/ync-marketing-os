import sql from "./connection";
import type {
  User,
  Lead,
  LeadAcquisition,
  LeadEnrichedDetails,
  LeadProcess,
  DemographicProfile,
  AcademicProfile,
  WorkProfile,
  StandardizedTestScores,
  LeadWithDetails,
  LeadListItem,
  PaginatedResponse,
  LeadFilters,
  DashboardMetrics,
  LeadStage,
} from "@/types";

// Helper function to convert snake_case to camelCase
function toCamelCase<T>(obj: any): T {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCase(item)) as T;
  }
  if (typeof obj === "object" && obj !== null) {
    const camelObj: any = {};
    for (const key in obj) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase()
      );
      camelObj[camelKey] = toCamelCase(obj[key]);
    }
    return camelObj;
  }
  return obj;
}

// ==================== USER QUERIES ====================

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email}
  `;
  return result.length > 0 ? toCamelCase<User>(result[0]) : null;
}

export async function createUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}): Promise<User> {
  const result = await sql`
    INSERT INTO users (first_name, last_name, email, role)
    VALUES (${data.firstName}, ${data.lastName}, ${data.email}, ${data.role})
    RETURNING *
  `;
  return toCamelCase<User>(result[0]);
}

export async function updateUser(
  id: number,
  data: Partial<User>
): Promise<User | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.firstName) {
    updates.push(`first_name = $${paramIndex++}`);
    values.push(data.firstName);
  }
  if (data.lastName) {
    updates.push(`last_name = $${paramIndex++}`);
    values.push(data.lastName);
  }
  if (data.role) {
    updates.push(`role = $${paramIndex++}`);
    values.push(data.role);
  }
  if (typeof data.isActive === "boolean") {
    updates.push(`is_active = $${paramIndex++}`);
    values.push(data.isActive);
  }

  if (updates.length === 0) return null;

  values.push(id);
  const result = await sql.unsafe(
    `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.length > 0 ? toCamelCase<User>(result[0]) : null;
}

export async function getAllAgents(): Promise<
  Pick<User, "id" | "firstName" | "lastName" | "email">[]
> {
  const result = await sql`
    SELECT id, first_name, last_name, email 
    FROM users 
    WHERE role = 'agent' AND is_active = true
    ORDER BY first_name, last_name
  `;
  return toCamelCase(result);
}

// ==================== LEAD QUERIES ====================

export async function createLead(data: {
  firstName: string;
  lastName: string;
  email?: string;
  mobile?: string;
  request?: string;
}): Promise<Lead> {
  const result = await sql`
    INSERT INTO leads (first_name, last_name, email, mobile, request)
    VALUES (${data.firstName}, ${data.lastName}, ${data.email || null}, ${
    data.mobile || null
  }, ${data.request || null})
    RETURNING *
  `;
  return toCamelCase<Lead>(result[0]);
}

export async function getLeadById(
  leadId: number,
  userId?: number,
  userRole?: string
): Promise<LeadWithDetails | null> {
  // Build the query based on user role
  let query;
  if (userRole === "agent" && userId) {
    query = sql`
      SELECT 
        l.*,
        json_build_object(
          'id', la.id, 'leadId', la.lead_id, 'platform', la.platform,
          'campaign', la.campaign, 'adSet', la.ad_set, 'ad', la.ad,
          'landingPageUrl', la.landing_page_url, 'ipv4', la.ipv4, 'ipv6', la.ipv6,
          'createdAt', la.created_at
        ) as acquisition,
        json_build_object(
          'id', led.id, 'leadId', led.lead_id, 'country', led.country,
          'university', led.university, 'level', led.level, 'stream', led.stream,
          'subject', led.subject, 'targetIntake', led.target_intake,
          'currentPursuit', led.current_pursuit
        ) as enriched_details,
        json_build_object(
          'id', lp.id, 'leadId', lp.lead_id, 'stage', lp.stage,
          'notes', lp.notes, 'createdAt', lp.created_at, 'updatedAt', lp.updated_at
        ) as process,
        json_build_object(
          'id', dp.id, 'leadId', dp.lead_id, 'cityTier', dp.city_tier,
          'familyIncomeRange', dp.family_income_range, 'sourceOfIncome', dp.source_of_income,
          'willTakeEduLoan', dp.will_take_edu_loan
        ) as demographic_profile,
        json_build_object(
          'id', ap.id, 'leadId', ap.lead_id, 'studyGrade', ap.study_grade,
          'school', ap.school, 'schoolBoard', ap.school_board, 'college', ap.college,
          'university', ap.university, 'studyStream', ap.study_stream,
          'gpa', ap.gpa, 'notes', ap.notes
        ) as academic_profile,
        json_build_object(
          'id', wp.id, 'leadId', wp.lead_id, 'workingAt', wp.working_at,
          'industry', wp.industry, 'workDesignation', wp.work_designation,
          'yearsOfExperience', wp.years_of_experience, 'notes', wp.notes
        ) as work_profile,
        json_build_object(
          'id', sts.id, 'leadId', sts.lead_id, 'ieltsScore', sts.ielts_score,
          'pteScore', sts.pte_score, 'toeflScore', sts.toefl_score,
          'satScore', sts.sat_score, 'greScore', sts.gre_score, 'gmatScore', sts.gmat_score
        ) as test_scores,
        json_build_object(
          'id', u.id, 'firstName', u.first_name, 'lastName', u.last_name, 'email', u.email
        ) as assigned_user
      FROM leads l
      LEFT JOIN lead_acquisition la ON l.id = la.lead_id
      LEFT JOIN lead_enriched_details led ON l.id = led.lead_id
      LEFT JOIN lead_process lp ON l.id = lp.lead_id
      LEFT JOIN demographic_profile dp ON l.id = dp.lead_id
      LEFT JOIN academic_profile ap ON l.id = ap.lead_id
      LEFT JOIN work_profile wp ON l.id = wp.lead_id
      LEFT JOIN standardized_test_scores sts ON l.id = sts.lead_id
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.id = ${leadId} AND l.assigned_to = ${userId}
    `;
  } else {
    query = sql`
      SELECT 
        l.*,
        json_build_object(
          'id', la.id, 'leadId', la.lead_id, 'platform', la.platform,
          'campaign', la.campaign, 'adSet', la.ad_set, 'ad', la.ad,
          'landingPageUrl', la.landing_page_url, 'ipv4', la.ipv4, 'ipv6', la.ipv6,
          'createdAt', la.created_at
        ) as acquisition,
        json_build_object(
          'id', led.id, 'leadId', led.lead_id, 'country', led.country,
          'university', led.university, 'level', led.level, 'stream', led.stream,
          'subject', led.subject, 'targetIntake', led.target_intake,
          'currentPursuit', led.current_pursuit
        ) as enriched_details,
        json_build_object(
          'id', lp.id, 'leadId', lp.lead_id, 'stage', lp.stage,
          'notes', lp.notes, 'createdAt', lp.created_at, 'updatedAt', lp.updated_at
        ) as process,
        json_build_object(
          'id', dp.id, 'leadId', dp.lead_id, 'cityTier', dp.city_tier,
          'familyIncomeRange', dp.family_income_range, 'sourceOfIncome', dp.source_of_income,
          'willTakeEduLoan', dp.will_take_edu_loan
        ) as demographic_profile,
        json_build_object(
          'id', ap.id, 'leadId', ap.lead_id, 'studyGrade', ap.study_grade,
          'school', ap.school, 'schoolBoard', ap.school_board, 'college', ap.college,
          'university', ap.university, 'studyStream', ap.study_stream,
          'gpa', ap.gpa, 'notes', ap.notes
        ) as academic_profile,
        json_build_object(
          'id', wp.id, 'leadId', wp.lead_id, 'workingAt', wp.working_at,
          'industry', wp.industry, 'workDesignation', wp.work_designation,
          'yearsOfExperience', wp.years_of_experience, 'notes', wp.notes
        ) as work_profile,
        json_build_object(
          'id', sts.id, 'leadId', sts.lead_id, 'ieltsScore', sts.ielts_score,
          'pteScore', sts.pte_score, 'toeflScore', sts.toefl_score,
          'satScore', sts.sat_score, 'greScore', sts.gre_score, 'gmatScore', sts.gmat_score
        ) as test_scores,
        json_build_object(
          'id', u.id, 'firstName', u.first_name, 'lastName', u.last_name, 'email', u.email
        ) as assigned_user
      FROM leads l
      LEFT JOIN lead_acquisition la ON l.id = la.lead_id
      LEFT JOIN lead_enriched_details led ON l.id = led.lead_id
      LEFT JOIN lead_process lp ON l.id = lp.lead_id
      LEFT JOIN demographic_profile dp ON l.id = dp.lead_id
      LEFT JOIN academic_profile ap ON l.id = ap.lead_id
      LEFT JOIN work_profile wp ON l.id = wp.lead_id
      LEFT JOIN standardized_test_scores sts ON l.id = sts.lead_id
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.id = ${leadId}
    `;
  }

  const result = await query;
  if (result.length === 0) return null;

  const lead = toCamelCase<LeadWithDetails>(result[0]);

  // Clean up null objects
  if (!lead.acquisition?.id) delete lead.acquisition;
  if (!lead.enrichedDetails?.id) delete lead.enrichedDetails;
  if (!lead.process?.id) delete lead.process;
  if (!lead.demographicProfile?.id) delete lead.demographicProfile;
  if (!lead.academicProfile?.id) delete lead.academicProfile;
  if (!lead.workProfile?.id) delete lead.workProfile;
  if (!lead.testScores?.id) delete lead.testScores;
  if (!lead.assignedUser?.id) delete lead.assignedUser;

  return lead;
}

export async function getLeads(
  filters: LeadFilters,
  page: number = 1,
  limit: number = 20,
  sortBy: string = "created_at",
  sortOrder: "asc" | "desc" = "desc",
  userId?: number,
  userRole?: string
): Promise<PaginatedResponse<LeadListItem>> {
  const offset = (page - 1) * limit;

  // Build WHERE clause
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  // Role-based filtering
  if (userRole === "agent" && userId) {
    conditions.push(`l.assigned_to = $${paramIndex++}`);
    params.push(userId);
  }

  if (filters.stage) {
    conditions.push(`lp.stage = $${paramIndex++}`);
    params.push(filters.stage);
  }

  if (filters.platform) {
    conditions.push(`la.platform = $${paramIndex++}`);
    params.push(filters.platform);
  }

  if (filters.assignedTo) {
    conditions.push(`l.assigned_to = $${paramIndex++}`);
    params.push(filters.assignedTo);
  }

  if (filters.dateFrom) {
    conditions.push(`l.created_at >= $${paramIndex++}`);
    params.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    conditions.push(`l.created_at <= $${paramIndex++}`);
    params.push(filters.dateTo);
  }

  if (filters.search) {
    conditions.push(
      `(l.first_name ILIKE $${paramIndex} OR l.last_name ILIKE $${paramIndex} OR l.email ILIKE $${paramIndex} OR l.mobile ILIKE $${paramIndex})`
    );
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Valid sort columns
  const validSortColumns = ["id", "first_name", "last_name", "created_at", "stage"];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "created_at";
  const orderDirection = sortOrder === "asc" ? "ASC" : "DESC";

  // Get total count
  const countResult = await sql.unsafe(
    `
    SELECT COUNT(DISTINCT l.id) as count
    FROM leads l
    LEFT JOIN lead_acquisition la ON l.id = la.lead_id
    LEFT JOIN lead_process lp ON l.id = lp.lead_id
    ${whereClause}
  `,
    params
  );

  const total = parseInt(countResult[0].count);
  const totalPages = Math.ceil(total / limit);

  // Get paginated data
  params.push(limit, offset);
  const dataResult = await sql.unsafe(
    `
    SELECT 
      l.id,
      l.first_name,
      l.last_name,
      l.email,
      l.mobile,
      l.created_at,
      l.assigned_to,
      COALESCE(lp.stage, 'New') as stage,
      la.platform,
      CONCAT(u.first_name, ' ', u.last_name) as assigned_user_name
    FROM leads l
    LEFT JOIN lead_acquisition la ON l.id = la.lead_id
    LEFT JOIN lead_process lp ON l.id = lp.lead_id
    LEFT JOIN users u ON l.assigned_to = u.id
    ${whereClause}
    ORDER BY l.${sortColumn} ${orderDirection}
    LIMIT $${paramIndex++} OFFSET $${paramIndex}
  `,
    params
  );

  return {
    data: toCamelCase<LeadListItem[]>(dataResult),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export async function updateLead(
  id: number,
  data: Partial<Lead>
): Promise<Lead | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.firstName) {
    updates.push(`first_name = $${paramIndex++}`);
    values.push(data.firstName);
  }
  if (data.lastName) {
    updates.push(`last_name = $${paramIndex++}`);
    values.push(data.lastName);
  }
  if (data.email !== undefined) {
    updates.push(`email = $${paramIndex++}`);
    values.push(data.email);
  }
  if (data.mobile !== undefined) {
    updates.push(`mobile = $${paramIndex++}`);
    values.push(data.mobile);
  }
  if (data.request !== undefined) {
    updates.push(`request = $${paramIndex++}`);
    values.push(data.request);
  }
  if (data.assignedTo !== undefined) {
    updates.push(`assigned_to = $${paramIndex++}`);
    values.push(data.assignedTo);
  }

  if (updates.length === 0) return null;

  values.push(id);
  const result = await sql.unsafe(
    `UPDATE leads SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.length > 0 ? toCamelCase<Lead>(result[0]) : null;
}

export async function assignLeads(
  leadIds: number[],
  assignedTo: number
): Promise<number> {
  const result = await sql`
    UPDATE leads 
    SET assigned_to = ${assignedTo}
    WHERE id = ANY(${leadIds})
  `;
  return result.count;
}

// ==================== LEAD ACQUISITION QUERIES ====================

export async function createLeadAcquisition(
  data: Omit<LeadAcquisition, "id" | "createdAt">
): Promise<LeadAcquisition> {
  const result = await sql`
    INSERT INTO lead_acquisition (
      lead_id, platform, campaign, ad_set, ad, landing_page_url, ipv4, ipv6
    )
    VALUES (
      ${data.leadId}, ${data.platform || null}, ${data.campaign || null},
      ${data.adSet || null}, ${data.ad || null}, ${data.landingPageUrl || null},
      ${data.ipv4 || null}, ${data.ipv6 || null}
    )
    RETURNING *
  `;
  return toCamelCase<LeadAcquisition>(result[0]);
}

// ==================== LEAD PROCESS QUERIES ====================

export async function upsertLeadProcess(data: {
  leadId: number;
  stage: LeadStage;
  notes?: string;
}): Promise<LeadProcess> {
  const result = await sql`
    INSERT INTO lead_process (lead_id, stage, notes)
    VALUES (${data.leadId}, ${data.stage}, ${data.notes || null})
    ON CONFLICT (lead_id) 
    DO UPDATE SET 
      stage = EXCLUDED.stage,
      notes = EXCLUDED.notes,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  return toCamelCase<LeadProcess>(result[0]);
}

export async function updateLeadStage(
  leadIds: number[],
  stage: LeadStage
): Promise<number> {
  const result = await sql`
    INSERT INTO lead_process (lead_id, stage)
    SELECT id, ${stage} FROM leads WHERE id = ANY(${leadIds})
    ON CONFLICT (lead_id) 
    DO UPDATE SET 
      stage = EXCLUDED.stage,
      updated_at = CURRENT_TIMESTAMP
  `;
  return result.count;
}

// ==================== PROFILE UPSERT QUERIES ====================

export async function upsertLeadEnrichedDetails(
  data: Omit<LeadEnrichedDetails, "id">
): Promise<LeadEnrichedDetails> {
  const result = await sql`
    INSERT INTO lead_enriched_details (
      lead_id, country, university, level, stream, subject, target_intake, current_pursuit
    )
    VALUES (
      ${data.leadId}, ${data.country || null}, ${data.university || null},
      ${data.level || null}, ${data.stream || null}, ${data.subject || null},
      ${data.targetIntake || null}, ${data.currentPursuit || null}
    )
    ON CONFLICT (lead_id) 
    DO UPDATE SET 
      country = EXCLUDED.country,
      university = EXCLUDED.university,
      level = EXCLUDED.level,
      stream = EXCLUDED.stream,
      subject = EXCLUDED.subject,
      target_intake = EXCLUDED.target_intake,
      current_pursuit = EXCLUDED.current_pursuit
    RETURNING *
  `;
  return toCamelCase<LeadEnrichedDetails>(result[0]);
}

export async function upsertDemographicProfile(
  data: Omit<DemographicProfile, "id">
): Promise<DemographicProfile> {
  const result = await sql`
    INSERT INTO demographic_profile (
      lead_id, city_tier, family_income_range, source_of_income, will_take_edu_loan
    )
    VALUES (
      ${data.leadId}, ${data.cityTier || null}, ${data.familyIncomeRange || null},
      ${data.sourceOfIncome || null}, ${data.willTakeEduLoan}
    )
    ON CONFLICT (lead_id) 
    DO UPDATE SET 
      city_tier = EXCLUDED.city_tier,
      family_income_range = EXCLUDED.family_income_range,
      source_of_income = EXCLUDED.source_of_income,
      will_take_edu_loan = EXCLUDED.will_take_edu_loan
    RETURNING *
  `;
  return toCamelCase<DemographicProfile>(result[0]);
}

export async function upsertAcademicProfile(
  data: Omit<AcademicProfile, "id">
): Promise<AcademicProfile> {
  const result = await sql`
    INSERT INTO academic_profile (
      lead_id, study_grade, school, school_board, college, university, study_stream, gpa, notes
    )
    VALUES (
      ${data.leadId}, ${data.studyGrade || null}, ${data.school || null},
      ${data.schoolBoard || null}, ${data.college || null}, ${data.university || null},
      ${data.studyStream || null}, ${data.gpa || null}, ${data.notes || null}
    )
    ON CONFLICT (lead_id) 
    DO UPDATE SET 
      study_grade = EXCLUDED.study_grade,
      school = EXCLUDED.school,
      school_board = EXCLUDED.school_board,
      college = EXCLUDED.college,
      university = EXCLUDED.university,
      study_stream = EXCLUDED.study_stream,
      gpa = EXCLUDED.gpa,
      notes = EXCLUDED.notes
    RETURNING *
  `;
  return toCamelCase<AcademicProfile>(result[0]);
}

export async function upsertWorkProfile(
  data: Omit<WorkProfile, "id">
): Promise<WorkProfile> {
  const result = await sql`
    INSERT INTO work_profile (
      lead_id, working_at, industry, work_designation, years_of_experience, notes
    )
    VALUES (
      ${data.leadId}, ${data.workingAt || null}, ${data.industry || null},
      ${data.workDesignation || null}, ${data.yearsOfExperience}, ${data.notes || null}
    )
    ON CONFLICT (lead_id) 
    DO UPDATE SET 
      working_at = EXCLUDED.working_at,
      industry = EXCLUDED.industry,
      work_designation = EXCLUDED.work_designation,
      years_of_experience = EXCLUDED.years_of_experience,
      notes = EXCLUDED.notes
    RETURNING *
  `;
  return toCamelCase<WorkProfile>(result[0]);
}

export async function upsertStandardizedTestScores(
  data: Omit<StandardizedTestScores, "id">
): Promise<StandardizedTestScores> {
  const result = await sql`
    INSERT INTO standardized_test_scores (
      lead_id, ielts_score, pte_score, toefl_score, sat_score, gre_score, gmat_score
    )
    VALUES (
      ${data.leadId}, ${data.ieltsScore}, ${data.pteScore},
      ${data.toeflScore}, ${data.satScore}, ${data.greScore}, ${data.gmatScore}
    )
    ON CONFLICT (lead_id) 
    DO UPDATE SET 
      ielts_score = EXCLUDED.ielts_score,
      pte_score = EXCLUDED.pte_score,
      toefl_score = EXCLUDED.toefl_score,
      sat_score = EXCLUDED.sat_score,
      gre_score = EXCLUDED.gre_score,
      gmat_score = EXCLUDED.gmat_score
    RETURNING *
  `;
  return toCamelCase<StandardizedTestScores>(result[0]);
}

// ==================== DASHBOARD QUERIES ====================

export async function getDashboardMetrics(
  userId?: number,
  userRole?: string
): Promise<DashboardMetrics> {
  const roleFilter =
    userRole === "agent" && userId ? sql`WHERE l.assigned_to = ${userId}` : sql``;

  // Total leads
  const totalResult = await sql`
    SELECT COUNT(*) as count FROM leads l ${roleFilter}
  `;

  // New leads today
  const todayResult = await sql`
    SELECT COUNT(*) as count FROM leads l 
    ${roleFilter}
    ${
      userRole === "agent" && userId
        ? sql`AND l.created_at >= CURRENT_DATE`
        : sql`WHERE l.created_at >= CURRENT_DATE`
    }
  `;

  // New leads this week
  const weekResult = await sql`
    SELECT COUNT(*) as count FROM leads l 
    ${roleFilter}
    ${
      userRole === "agent" && userId
        ? sql`AND l.created_at >= CURRENT_DATE - INTERVAL '7 days'`
        : sql`WHERE l.created_at >= CURRENT_DATE - INTERVAL '7 days'`
    }
  `;

  // Leads by stage
  const stageResult = await sql`
    SELECT COALESCE(lp.stage, 'New') as stage, COUNT(*) as count
    FROM leads l
    LEFT JOIN lead_process lp ON l.id = lp.lead_id
    ${roleFilter}
    GROUP BY stage
    ORDER BY count DESC
  `;

  // Leads by platform
  const platformResult = await sql`
    SELECT COALESCE(la.platform, 'Unknown') as platform, COUNT(*) as count
    FROM leads l
    LEFT JOIN lead_acquisition la ON l.id = la.lead_id
    ${roleFilter}
    GROUP BY platform
    ORDER BY count DESC
    LIMIT 10
  `;

  const metrics: DashboardMetrics = {
    totalLeads: parseInt(totalResult[0].count),
    newLeadsToday: parseInt(todayResult[0].count),
    newLeadsThisWeek: parseInt(weekResult[0].count),
    leadsByStage: toCamelCase(stageResult),
    leadsByPlatform: toCamelCase(platformResult),
  };

  // Agent performance (admins only)
  if (userRole === "admin") {
    const agentResult = await sql`
      SELECT 
        u.id as agent_id,
        CONCAT(u.first_name, ' ', u.last_name) as agent_name,
        COUNT(l.id) as lead_count
      FROM users u
      LEFT JOIN leads l ON u.id = l.assigned_to
      WHERE u.role = 'agent' AND u.is_active = true
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY lead_count DESC
    `;
    metrics.agentPerformance = toCamelCase(agentResult);
  }

  return metrics;
}

// ==================== EXPORT QUERIES ====================

export async function getLeadsForExport(
  leadIds: number[],
  userId?: number,
  userRole?: string
): Promise<LeadWithDetails[]> {
  let query;

  if (userRole === "agent" && userId) {
    query = sql`
      SELECT 
        l.*,
        la.platform, la.campaign, la.ad_set, la.ad, la.landing_page_url,
        lp.stage, lp.notes as process_notes,
        led.country, led.university, led.level, led.stream, led.subject, led.target_intake, led.current_pursuit,
        u.first_name as assigned_first_name, u.last_name as assigned_last_name
      FROM leads l
      LEFT JOIN lead_acquisition la ON l.id = la.lead_id
      LEFT JOIN lead_process lp ON l.id = lp.lead_id
      LEFT JOIN lead_enriched_details led ON l.id = led.lead_id
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.id = ANY(${leadIds}) AND l.assigned_to = ${userId}
    `;
  } else {
    query = sql`
      SELECT 
        l.*,
        la.platform, la.campaign, la.ad_set, la.ad, la.landing_page_url,
        lp.stage, lp.notes as process_notes,
        led.country, led.university, led.level, led.stream, led.subject, led.target_intake, led.current_pursuit,
        u.first_name as assigned_first_name, u.last_name as assigned_last_name
      FROM leads l
      LEFT JOIN lead_acquisition la ON l.id = la.lead_id
      LEFT JOIN lead_process lp ON l.id = lp.lead_id
      LEFT JOIN lead_enriched_details led ON l.id = led.lead_id
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.id = ANY(${leadIds})
    `;
  }

  const result = await query;
  return toCamelCase<LeadWithDetails[]>(result);
}

