export class User {
    constructor(
        public id: string,
        public name?: string,
        public email?: string,
        public phone?: string,
        public passwordHash?: string,
        public roles: string[] = [],
        public isActive: boolean = false
    ) { }
}
