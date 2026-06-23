import { User } from '../models/User';

export const updateProfile = async (userId: string, data: any) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  // Update base fields
  if (data.fullName !== undefined) {
    user.fullName = data.fullName;
  }

  // Update role-specific fields dynamically based on the user's discriminator role
  if (user.role === 'student') {
    if (data.branch !== undefined) {
      (user as any).branch = data.branch;
    }
    if (data.yearOfRegistration !== undefined) {
      (user as any).yearOfRegistration = data.yearOfRegistration;
    }
    if (data.dob !== undefined) {
      (user as any).dob = data.dob;
    }
    if (data.phoneNumber !== undefined) {
      (user as any).phoneNumber = data.phoneNumber;
    }
  } else if (user.role === 'faculty') {
    if (data.phoneNumber !== undefined) {
      (user as any).phoneNumber = data.phoneNumber;
    }
  } else if (user.role === 'contributor') {
    if (data.organizationName !== undefined) {
      (user as any).organizationName = data.organizationName;
    }
    if (data.roleInOrganization !== undefined) {
      (user as any).roleInOrganization = data.roleInOrganization;
    }
  }

  await user.save();
  return user;
};
