import { IUserRepository } from '../../application/Repositories/IUserRepository';
import { User } from '../../domain/User';
import { firestore } from '../../config/firestore';
import { UserDocument, UserRole } from '../../models/FirestoreTypes';
import { Timestamp } from 'firebase-admin/firestore';

export class UserRepositoryFirestore implements IUserRepository {
    private collection = firestore.collection('users');

    protected toFirestore(user: User): UserDocument {
        const now = Timestamp.now();
        const firestoreData: UserDocument = {
            id: user.id,
            org_id: user.orgId || '',
            email: user.email || '',
            name: user.name || '',
            role: (user.roles[0] as UserRole) || UserRole.VIEWER,
            is_active: user.isActive,
            timezone: user.preferences?.timezone || 'UTC',
            roles: user.roles as string[],
            created_at: user.createdAt ? Timestamp.fromDate(user.createdAt) : now,
            updated_at: now
        };

        // Only include phone if it's not undefined
        if (user.phone !== undefined) {
            firestoreData.phone = user.phone;
        }

        return firestoreData;
    }

    protected fromFirestore(data: UserDocument): User {
        return new User(
            data.id || '',
            data.org_id,
            data.name,
            data.email,
            data.phone,
            undefined, // googleId - not in old schema
            undefined, // avatar - not in old schema  
            (data.roles || [data.role]) as UserRole[],
            data.is_active,
            { timezone: data.timezone },
            undefined, // lastLoginAt - not in old schema
            data.created_at?.toDate(),
            data.updated_at?.toDate()
        );
    }

    async create(user: User): Promise<User> {
        const firestoreData = this.toFirestore(user);
        const docRef = this.collection.doc();
        firestoreData.id = docRef.id;
        await docRef.set(firestoreData);
        return this.fromFirestore(firestoreData);
    }

    async findById(id: string): Promise<User | null> {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) {
            return null;
        }
        const data = { id: doc.id, ...doc.data() } as UserDocument;
        return this.fromFirestore(data);
    }

    async update(user: User): Promise<User> {
        const firestoreData = this.toFirestore(user);
        await this.collection.doc(user.id).set(firestoreData, { merge: true });
        return this.fromFirestore(firestoreData);
    }

    async delete(id: string): Promise<void> {
        await this.collection.doc(id).delete();
    }

    async findByEmail(email: string): Promise<User | null> {
        try {
            const snapshot = await this.collection
                .where('email', '==', email)
                .limit(1)
                .get();

            if (snapshot.empty) {
                return null;
            }

            const doc = snapshot.docs[0];
            const data = { id: doc.id, ...doc.data() } as UserDocument;
            return this.fromFirestore(data);
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    async findByPhone(phone: string): Promise<User | null> {
        try {
            const snapshot = await this.collection
                .where('phone', '==', phone)
                .limit(1)
                .get();

            if (snapshot.empty) {
                return null;
            }

            const doc = snapshot.docs[0];
            const data = { id: doc.id, ...doc.data() } as UserDocument;
            return this.fromFirestore(data);
        } catch (error) {
            console.error('Error finding user by phone:', error);
            throw error;
        }
    }

    async findByGoogleId(googleId: string): Promise<User | null> {
        // Google ID is not stored in the legacy schema
        // For now, we'll return null and handle this in the auth flow
        return null;
    }

    async findByOrganizationId(orgId: string): Promise<User[]> {
        try {
            const snapshot = await this.collection
                .where('org_id', '==', orgId)
                .get();

            return snapshot.docs.map((doc) => {
                const data = { id: doc.id, ...doc.data() } as UserDocument;
                return this.fromFirestore(data);
            });
        } catch (error) {
            console.error('Error finding users by organization:', error);
            throw error;
        }
    }
}
