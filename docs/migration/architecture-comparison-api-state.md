# API, State, Auth, and Persistence Comparison

**Parent index:** [ARCHITECTURE_COMPARISON.md](./ARCHITECTURE_COMPARISON.md)

---

### 4. API Comparison

#### Current
```javascript
// server.js - Simple HTTP server
const server = http.createServer((req, res) => {
  // Only 2 endpoints!
  
  if (req.url === '/api/components') {
    // Return component list
  }
  
  if (req.url === '/api/calculate') {
    // Basic calculation
  }
  
  // No authentication
  // No validation
  // No error handling
  // No documentation
});
```

#### Target (NestJS)
```typescript
// Comprehensive RESTful API with 20+ endpoints

// Authentication
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
GET    /api/v1/auth/profile

// Materials (CRUD)
GET    /api/v1/materials
GET    /api/v1/materials/:id
POST   /api/v1/materials          (admin only)
PUT    /api/v1/materials/:id      (admin only)
DELETE /api/v1/materials/:id      (admin only)

// Mixes (CRUD + Search)
GET    /api/v1/mixes
GET    /api/v1/mixes/:id
POST   /api/v1/mixes
PUT    /api/v1/mixes/:id
DELETE /api/v1/mixes/:id
GET    /api/v1/mixes/search

// Calculations (Multiple types)
POST   /api/v1/calculations/blend-optimize
POST   /api/v1/calculations/phase-equilibrium
POST   /api/v1/calculations/thermal-performance
POST   /api/v1/calculations/psd
GET    /api/v1/calculations/history
GET    /api/v1/calculations/:id

// Features:
// ✅ JWT authentication
// ✅ Role-based access control
// ✅ Input validation (class-validator)
// ✅ Error handling (filters)
// ✅ Swagger documentation
// ✅ Rate limiting
// ✅ Request logging
// ✅ CORS configured
```

---

### 5. State Management

#### Current
```javascript
// Global variables (anti-pattern)
let fractionCounter = 0;
let currentResults = [];
let selectedResultIndex = -1;

// Manual DOM manipulation
function addFraction() {
  const html = `<div id="fraction-${fractionCounter}">...</div>`;
  document.getElementById('container').innerHTML += html;
  fractionCounter++;
}

// LocalStorage for persistence
function saveMix(mix) {
  const mixes = JSON.parse(localStorage.getItem('mixes') || '[]');
  mixes.push(mix);
  localStorage.setItem('mixes', JSON.stringify(mixes));
}
```

**Problems:**
- Global state (hard to debug)
- No state history
- No undo/redo
- Lost on browser close (unless LocalStorage)
- Can't sync across tabs

#### Target (Redux + React Query)
```typescript
// Redux Slice (global state)
const mixesSlice = createSlice({
  name: 'mixes',
  initialState: {
    items: [],
    selectedId: null,
    loading: false,
  },
  reducers: {
    selectMix: (state, action) => {
      state.selectedId = action.payload;
    },
    // ... other reducers
  },
});

// React Query (server state)
function useMixes() {
  return useQuery({
    queryKey: ['mixes'],
    queryFn: () => api.get('/mixes'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Component
function MixLibrary() {
  const dispatch = useDispatch();
  const selectedId = useSelector(state => state.mixes.selectedId);
  const { data: mixes, isLoading } = useMixes();
  
  return (
    <div>
      {mixes?.map(mix => (
        <MixCard
          key={mix.id}
          mix={mix}
          selected={mix.id === selectedId}
          onClick={() => dispatch(selectMix(mix.id))}
        />
      ))}
    </div>
  );
}
```

**Benefits:**
- ✅ Centralized state management
- ✅ Predictable state updates
- ✅ DevTools for debugging
- ✅ Automatic caching
- ✅ Optimistic updates
- ✅ Background refetching

---

### 6. Authentication & Authorization

#### Current
```
❌ No authentication
❌ No user accounts
❌ No access control
❌ All data public
```

#### Target
```typescript
// JWT-based authentication

// 1. User registers
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "secure_password",
  "firstName": "John",
  "lastName": "Doe"
}

// 2. User logs in
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "secure_password"
}

// Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user"
  }
}

// 3. Access protected endpoints
GET /api/v1/mixes
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Backend Guard
@UseGuards(JwtAuthGuard)
@Get('mixes')
async getUserMixes(@CurrentUser() user: User) {
  // Only returns mixes owned by authenticated user
  return this.mixesService.findByUser(user.id);
}

// Admin-only endpoints
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Post('materials')
async createMaterial(@Body() dto: CreateMaterialDto) {
  // Only admins can create materials
  return this.materialsService.create(dto);
}
```

**Features:**
- ✅ Secure password hashing (bcrypt)
- ✅ JWT tokens (access + refresh)
- ✅ Role-based access control
- ✅ Protected routes
- ✅ User ownership (each user's mixes)
- ✅ Session management

---

### 7. Database & Persistence

#### Current
```javascript
// LocalStorage only
const mixes = JSON.parse(localStorage.getItem('savedMixes') || '[]');

// Limitations:
// ❌ 5-10MB limit
// ❌ Clears on browser data clear
// ❌ No relations
// ❌ No querying capabilities
// ❌ No concurrent access
// ❌ No backups
// ❌ Can't share between users
```

#### Target (PostgreSQL + TypeORM)
```typescript
// Relational database with full SQL power

@Entity('mixes')
export class Mix {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  name: string;

  @OneToMany(() => MixFraction, fraction => fraction.mix)
  fractions: MixFraction[];

  @CreateDateColumn()
  createdAt: Date;
}

// Powerful queries
const mixes = await this.mixRepo.find({
  where: {
    user: { id: userId },
    tags: ArrayContains(['high-alumina']),
  },
  relations: ['fractions', 'fractions.material'],
  order: { createdAt: 'DESC' },
  take: 10,
});

// Full-text search
const results = await this.mixRepo
  .createQueryBuilder('mix')
  .where('mix.name ILIKE :search', { search: `%${query}%` })
  .orWhere('mix.description ILIKE :search', { search: `%${query}%` })
  .getMany();

// Complex aggregations
const stats = await this.mixRepo
  .createQueryBuilder('mix')
  .select('mix.category', 'category')
  .addSelect('COUNT(*)', 'count')
  .groupBy('mix.category')
  .getRawMany();
```

**Benefits:**
- ✅ Unlimited storage
- ✅ ACID transactions
- ✅ Complex relationships
- ✅ Powerful querying
- ✅ Indexing for performance
- ✅ Migrations (version control)
- ✅ Backups & restore
- ✅ Multi-user access

---
