import { DatabaseService } from '../database';
import { supabase } from '../supabase';

export type UserRole = 'investor' | 'property_manager' | 'admin';

export interface RolePermissions {
  can_create_properties: boolean;
  can_manage_properties: boolean;
  can_approve_kyc: boolean;
  can_manage_users: boolean;
  can_view_analytics: boolean;
  can_manage_system_settings: boolean;
  can_process_withdrawals: boolean;
  can_manage_staking_pools: boolean;
}

/**
 * Role-based access control manager
 */
export class RoleManager {
  private static rolePermissions: Record<UserRole, RolePermissions> = {
    investor: {
      can_create_properties: false,
      can_manage_properties: false,
      can_approve_kyc: false,
      can_manage_users: false,
      can_view_analytics: false,
      can_manage_system_settings: false,
      can_process_withdrawals: false,
      can_manage_staking_pools: false
    },
    property_manager: {
      can_create_properties: true,
      can_manage_properties: true,
      can_approve_kyc: false,
      can_manage_users: false,
      can_view_analytics: true,
      can_manage_system_settings: false,
      can_process_withdrawals: false,
      can_manage_staking_pools: false
    },
    admin: {
      can_create_properties: true,
      can_manage_properties: true,
      can_approve_kyc: true,
      can_manage_users: true,
      can_view_analytics: true,
      can_manage_system_settings: true,
      can_process_withdrawals: true,
      can_manage_staking_pools: true
    }
  };

  /**
   * Get user role and permissions
   */
  static async getUserRole(userId: string): Promise<{ role: UserRole; permissions: RolePermissions } | null> {
    try {
      const user = await DatabaseService.getUserProfile(userId);
      if (!user) return null;

      const role = user.role as UserRole;
      const permissions = this.rolePermissions[role] || this.rolePermissions.investor;

      return { role, permissions };
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  /**
   * Check if user has specific permission
   */
  static async hasPermission(userId: string, permission: keyof RolePermissions): Promise<boolean> {
    try {
      const roleData = await this.getUserRole(userId);
      if (!roleData) return false;

      return roleData.permissions[permission];
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Update user role (admin only)
   */
  static async updateUserRole(adminUserId: string, targetUserId: string, newRole: UserRole): Promise<void> {
    try {
      // Check if admin has permission
      const hasPermission = await this.hasPermission(adminUserId, 'can_manage_users');
      if (!hasPermission) {
        throw new Error('Insufficient permissions to update user role');
      }

      // Update user role
      await DatabaseService.updateUserProfile(targetUserId, { role: newRole });

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'user_role_updated',
        resource_type: 'user',
        resource_id: targetUserId,
        new_values: { role: newRole, updated_by: adminUserId }
      });

    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(role: UserRole): Promise<any[]> {
    if (!supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', role)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users by role:', error);
      return [];
    }
  }

  /**
   * Middleware function to check permissions
   */
  static createPermissionMiddleware(requiredPermission: keyof RolePermissions) {
    return async (userId: string): Promise<boolean> => {
      return await this.hasPermission(userId, requiredPermission);
    };
  }

  /**
   * Get role hierarchy (for UI display)
   */
  static getRoleHierarchy(): { role: UserRole; label: string; level: number }[] {
    return [
      { role: 'investor', label: 'Investor', level: 1 },
      { role: 'property_manager', label: 'Property Manager', level: 2 },
      { role: 'admin', label: 'Administrator', level: 3 }
    ];
  }

  /**
   * Check if user can perform action on resource
   */
  static async canPerformAction(
    userId: string, 
    action: string, 
    resourceType: string, 
    resourceId?: string
  ): Promise<boolean> {
    try {
      const roleData = await this.getUserRole(userId);
      if (!roleData) return false;

      // Define action-permission mappings
      const actionPermissions: Record<string, keyof RolePermissions> = {
        'create_property': 'can_create_properties',
        'update_property': 'can_manage_properties',
        'delete_property': 'can_manage_properties',
        'approve_kyc': 'can_approve_kyc',
        'manage_user': 'can_manage_users',
        'view_analytics': 'can_view_analytics',
        'update_settings': 'can_manage_system_settings',
        'process_withdrawal': 'can_process_withdrawals',
        'manage_staking': 'can_manage_staking_pools'
      };

      const requiredPermission = actionPermissions[action];
      if (!requiredPermission) return false;

      return roleData.permissions[requiredPermission];
    } catch (error) {
      console.error('Error checking action permission:', error);
      return false;
    }
  }
}