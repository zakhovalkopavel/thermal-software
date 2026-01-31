# UI Reorganization - Testing Guide

## Quick Test Steps

### 1. Start the Application

```bash
cd /opt/thermal-software
make up
```

Wait for services to start (~30 seconds).

### 2. Test Homepage

**URL:** `http://localhost:18080/`

**Check:**
- [ ] Homepage loads with hero section
- [ ] Two module cards visible (Phase Calculator, Blend Optimizer)
- [ ] Features grid shows 6 items
- [ ] Quick start section with 4 steps
- [ ] Documentation cards with 4 items
- [ ] Footer with 4 columns
- [ ] Navigation menu at top
- [ ] All links work

**Expected behavior:**
- Gradient hero background with pattern overlay
- Cards have hover effects (lift on hover)
- "Open Calculator" buttons link to respective modules
- Navigation menu highlights "Home" as active

### 3. Test Phase Calculator

**URL:** `http://localhost:18080/phase-calculator.html`

**Check:**
- [ ] Page loads successfully
- [ ] Navigation menu present (Phase Calculator highlighted)
- [ ] Two-column layout (inputs left, results right)
- [ ] Component dropdown populated
- [ ] Can add components
- [ ] Calculate button works
- [ ] Results display correctly
- [ ] Footer present

**Navigation test:**
- [ ] Click "Home" → goes to homepage
- [ ] Click "Blend Optimizer" → goes to optimizer
- [ ] Click "About" → goes to about page

### 4. Test Blend Optimizer

**URL:** `http://localhost:18080/blend-optimizer.html`

**Check:**
- [ ] Page loads successfully
- [ ] Navigation menu present (Blend Optimizer highlighted)
- [ ] Fraction table displays correctly
- [ ] Can add/remove fractions
- [ ] Material dropdown populated
- [ ] Optimization options visible
- [ ] "Browse Library" button works
- [ ] Save/Load modals appear correctly
- [ ] Footer present

**CSS check:**
- [ ] Fraction rows have grid layout
- [ ] Options in two columns
- [ ] Results cards styled properly
- [ ] Modals overlay correctly
- [ ] No inline styles visible (all external)

### 5. Test About Page

**URL:** `http://localhost:18080/about.html`

**Check:**
- [ ] Page loads successfully
- [ ] Navigation menu present (About highlighted)
- [ ] All sections visible
- [ ] 3-column technology grid displays
- [ ] Version table formatted correctly
- [ ] Documentation buttons work
- [ ] Footer present

### 6. Test Navigation Consistency

**On each page:**
- [ ] Brand logo and name visible
- [ ] Navigation menu has 4 items
- [ ] Active page is highlighted
- [ ] Hover effects work on menu items
- [ ] Clicking logo/brand goes to homepage

### 7. Test Responsive Design

**Resize browser window:**

**Desktop (> 992px):**
- [ ] Module cards in 2 columns
- [ ] Features in 3 columns
- [ ] Navigation menu horizontal
- [ ] Footer in 4 columns

**Tablet (768px - 992px):**
- [ ] Module cards in 1 column
- [ ] Features in 2 columns
- [ ] Navigation menu horizontal (may stack brand)
- [ ] Footer in 2 columns

**Mobile (< 768px):**
- [ ] All grids become single column
- [ ] Navigation menu stacks vertically
- [ ] Fraction table responsive
- [ ] Modals fit screen
- [ ] Footer single column

### 8. Test CSS Loading

**Open browser DevTools (F12):**

**Console tab:**
- [ ] No CSS file errors (404)
- [ ] No JavaScript errors related to styles

**Network tab:**
- [ ] All CSS files load successfully
  - base.css
  - navigation.css
  - forms.css
  - components.css
  - calculator.css (on calculator page)
  - blend-optimizer.css (on optimizer page)
  - homepage.css (on homepage)

**Elements tab:**
- [ ] CSS variables defined in :root
- [ ] No duplicate style definitions
- [ ] Styles apply correctly

### 9. Test Components

**Buttons:**
- [ ] Primary buttons have gradient
- [ ] Hover effect (lift + shadow)
- [ ] Different button variants styled correctly
- [ ] Small/large buttons work

**Forms:**
- [ ] Input fields have border
- [ ] Focus state shows blue outline
- [ ] Select dropdowns have arrow icon
- [ ] Disabled inputs grayed out

**Cards:**
- [ ] White background with shadow
- [ ] Hover effect (lift slightly)
- [ ] Rounded corners
- [ ] Proper padding

**Modals:**
- [ ] Dark overlay background
- [ ] Centered on screen
- [ ] Slide-down animation
- [ ] Close button (×) works
- [ ] Scrollable if content too tall

**Tables:**
- [ ] Header row colored
- [ ] Row hover effect
- [ ] Borders visible
- [ ] Responsive (scrollable on mobile)

### 10. Test Backwards Compatibility

**Old bookmark test:**

**URL:** `http://localhost:18080/index-old.html`

**Check:**
- [ ] Old calculator page still accessible
- [ ] Functionality intact
- [ ] Can be used as fallback

## Common Issues & Solutions

### Issue: CSS not loading

**Symptoms:** Page looks unstyled, plain HTML  
**Solution:**
```bash
# Check if nginx is serving CSS files
curl http://localhost:18080/css/base.css | head
```

**Expected:** CSS content  
**If error:** Check nginx.conf, restart services

### Issue: 404 on CSS files

**Symptoms:** DevTools shows 404 errors  
**Solution:**
- Verify files exist: `ls /opt/thermal-software/refractory/public/css/`
- Check file permissions: `chmod 644 public/css/*.css`
- Restart: `make restart`

### Issue: Navigation not working

**Symptoms:** Clicking menu items does nothing  
**Solution:**
- Check that href attributes are correct
- Verify pages exist in public/ directory
- Check for JavaScript errors in console

### Issue: Responsive layout broken

**Symptoms:** Mobile view looks wrong  
**Solution:**
- Check viewport meta tag in HTML
- Verify media queries in CSS
- Test with actual mobile device or Chrome DevTools device mode

### Issue: Modals don't appear

**Symptoms:** Clicking library browser does nothing  
**Solution:**
- Check JavaScript console for errors
- Verify modal HTML structure matches CSS selectors
- Check z-index values

## Performance Check

**Test:** Load homepage with DevTools Network tab open

**Expected metrics:**
- **Total page size:** < 100 KB
- **CSS total:** < 30 KB
- **Number of requests:** < 20
- **Load time:** < 1 second (local)

**Test:** Load calculator/optimizer pages

**Expected:**
- Additional CSS files load only on needed pages
- No duplicate loading of shared CSS
- Smooth page transitions

## Accessibility Check

**Keyboard navigation:**
- [ ] Tab key moves through form fields
- [ ] Tab key highlights navigation items
- [ ] Enter key activates buttons/links
- [ ] Focus indicator visible

**Screen reader:**
- [ ] Headings hierarchical (h1 → h2 → h3)
- [ ] Links have descriptive text
- [ ] Images have alt text (if added)
- [ ] Form labels associated with inputs

## Visual Regression Check

Compare screenshots before/after:

1. Take screenshot of each page
2. Compare layouts
3. Verify no unexpected changes
4. Check that improvements are visible

## Sign-Off Checklist

- [ ] All pages load without errors
- [ ] Navigation works on all pages
- [ ] CSS modularization complete
- [ ] No inline styles in HTML
- [ ] Responsive design tested
- [ ] Backwards compatibility verified
- [ ] Documentation updated
- [ ] Performance acceptable
- [ ] Accessibility improved

## Success Criteria

✅ Homepage serves as professional entry point  
✅ Navigation menu works seamlessly  
✅ CSS organized into logical modules  
✅ All functionality preserved  
✅ Responsive design works  
✅ No console errors  
✅ Professional appearance throughout

---

**If all checks pass:** ✅ UI reorganization successful!  
**If issues found:** Document and fix, then re-test.

**Testing completed:** _______________  
**Tested by:** _______________  
**Status:** _______________

