# Architecture and Code Organization Comparison

**Parent index:** [ARCHITECTURE_COMPARISON.md](./ARCHITECTURE_COMPARISON.md)

---

### 1. Architecture

#### Current (Monolithic)
```
Browser
   │
   ├─ HTML Files (blend-optimizer.html, phase-calculator.html)
   │
   ├─ JavaScript Modules
   │   ├─ BlendOptimizer.js
   │   ├─ PSDCalculator.js
   │   ├─ MaterialLibrary.js
   │   └─ MixLibraryService.js (LocalStorage)
   │
   └─ Simple Node.js Server (Optional)
       └─ 2 endpoints: /api/components, /api/calculate
```

**Limitations:**
- ❌ All logic runs in browser
- ❌ No persistent storage
- ❌ No user accounts
- ❌ Limited data sharing
- ❌ Can't handle heavy computations
- ❌ No background processing

#### Target (Client-Server)
```
┌────────────────────────────────────────────────┐
│              Nginx (Reverse Proxy)             │
└────────────────────────────────────────────────┘
           │                        │
           ↓                        ↓
    ┌──────────┐           ┌──────────────────┐
    │ React    │           │  NestJS Backend  │
    │ Frontend │──────────→│                  │
    │ (SPA)    │   API     │  - Controllers   │
    │          │   Calls   │  - Services      │
    │          │           │  - Repositories  │
    └──────────┘           └──────────────────┘
                                   │
                         ┌───────���─┴──────────┐
                         ↓                    ↓
                  ┌─────────────┐      ┌──────────┐
                  │ PostgreSQL  │      │  Redis   │
                  │  (Storage)  │      │ (Cache)  │
                  └─────────────┘      └──────────┘
```

**Benefits:**
- ✅ Clean separation of concerns
- ✅ Persistent database storage
- ✅ User authentication & authorization
- ✅ Heavy calculations on server
- ✅ Background job processing
- ✅ Real-time updates (WebSockets)
- ✅ API can serve multiple clients

---

### 2. Code Organization

#### Current
```
refractory/
├── public/
│   ├── blend-optimizer.html     ← Monolithic HTML with embedded logic
│   ├── phase-calculator.html
│   └── js/
│       ├── blend-optimizer.js   ← UI + Business logic mixed
│       └── calculator.js
├── src/                          ← TypeScript business logic
│   ├── calculators/
│   ├── data/
│   └── services/
└── server.js                     ← Simple HTTP server
```

#### Target
```
backend/                          ← NestJS API (clean architecture)
├── src/
│   ├── modules/
│   │   ├── auth/                ← Authentication module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── guards/
│   │   │   └── strategies/
│   │   ├── materials/           ← Materials module
│   │   │   ├── materials.controller.ts  (HTTP endpoints)
│   │   │   ├── materials.service.ts     (business logic)
│   │   │   ├── entities/                (database models)
│   │   │   └── dto/                     (data transfer objects)
│   │   └── calculations/        ← Calculations module
│   │       ├── services/
│   │       │   ├── blend-optimizer.service.ts
│   │       │   ├── psd-calculator.service.ts
│   │       │   └── phase-equilibrium.service.ts
│   │       └── calculations.controller.ts
│   └── database/
│       └── migrations/          ← Version-controlled schema
│
frontend/                        ← React SPA
├── src/
│   ├── pages/                   ← Page components
│   │   ├── BlendOptimizer/
│   │   └── PhaseCalculator/
│   ├── components/              ← Reusable UI components
│   ├── features/                ← Feature-specific code
│   ├── store/                   ← State management (Redux)
│   └── api/                     ← API client layer
```

---

### 3. Data Flow Comparison

#### Current (Browser-Side)
```javascript
// blend-optimizer.html + blend-optimizer.js
function optimizeBlend() {
  // 1. Get form data (DOM manipulation)
  const fractions = getFractionsFromForm();
  
  // 2. Execute calculation IN BROWSER
  const optimizer = new BlendOptimizer();
  const results = optimizer.optimize(fractions, options);
  
  // 3. Save to LocalStorage
  localStorage.setItem('myMix', JSON.stringify(results));
  
  // 4. Display results (DOM manipulation)
  displayResults(results);
}
```

**Issues:**
- All data in browser memory
- Lost on page refresh (unless saved to LocalStorage)
- Can't share with other users
- Slow for large calculations

#### Target (Client-Server)
```typescript
// FRONTEND: React Component
function BlendOptimizerPage() {
  const [fractions, setFractions] = useState([]);
  
  const { mutate: optimize, data: results } = useMutation({
    mutationFn: (data) => api.post('/calculations/blend-optimize', data),
    onSuccess: (data) => {
      // Results cached on server
      // Saved to database
      // Can be retrieved later
    }
  });
  
  return (
    <form onSubmit={() => optimize({ fractions, options })}>
      {/* React components */}
    </form>
  );
}

// BACKEND: NestJS Controller
@Controller('calculations')
export class CalculationsController {
  @Post('blend-optimize')
  @UseGuards(JwtAuthGuard)
  async optimizeBlend(
    @Body() dto: BlendOptimizeDto,
    @CurrentUser() user: User,
  ) {
    // 1. Validate input (class-validator)
    // 2. Execute calculation on server
    const results = await this.blendOptimizer.optimize(dto);
    
    // 3. Save to database
    await this.calculationsRepo.save({
      userId: user.id,
      type: 'blend-optimize',
      inputData: dto,
      results,
    });
    
    // 4. Cache results (Redis)
    await this.cache.set(`calc:${id}`, results, 3600);
    
    // 5. Return to client
    return results;
  }
}
```

**Benefits:**
- Server-side processing (faster, more reliable)
- Persistent storage in PostgreSQL
- Results cached in Redis
- Can retrieve calculation history
- Can share results with other users

---
