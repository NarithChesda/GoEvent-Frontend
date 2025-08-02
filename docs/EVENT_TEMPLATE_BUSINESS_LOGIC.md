# Event Template Business Logic Documentation

## Overview

This document describes the comprehensive business logic behind the Event Template system in GoEvent, including template management, pricing strategies, user access control, and payment integration workflows.

## Template Management System

### Template Lifecycle

#### Creation and Setup
```python
# Template creation workflow
def create_event_template(template_data):
    """
    Business logic for creating a new event template
    """
    # 1. Validate template data
    validate_template_assets(template_data)
    
    # 2. Create template with business rules
    template = EventTemplate.objects.create(
        name=template_data['name'],
        package_plan=template_data.get('package_plan'),
        requires_payment=template_data.get('requires_payment', True),
        is_active=False  # Templates start inactive until reviewed
    )
    
    # 3. Apply business validation
    template.clean()  # Validates pricing-payment relationship
    
    # 4. Setup default colors and fonts
    setup_default_template_assets(template)
    
    return template
```

#### Template Validation Rules
1. **Pricing-Payment Consistency**: Templates requiring payment must have a pricing plan
2. **Asset Validation**: All uploaded assets must meet security and quality standards
3. **Naming Uniqueness**: Template names must be unique within the system
4. **Category Association**: Templates should be associated with appropriate categories

### Template Status Management

#### Activation Workflow
```python
def activate_template(template_id, admin_user):
    """
    Business logic for template activation
    """
    template = EventTemplate.objects.get(id=template_id)
    
    # Business rules for activation
    if not template.package_plan and template.requires_payment:
        raise ValidationError("Cannot activate paid template without pricing plan")
    
    if not template.preview_image:
        raise ValidationError("Template must have preview image before activation")
    
    # Activate template
    template.is_active = True
    template.save()
    
    # Log activation
    log_template_activation(template, admin_user)
    
    # Notify users about new template
    notify_users_new_template(template)
```

#### Deactivation Rules
- Templates cannot be deactivated if they're currently in use by active events
- Users who purchased deactivated templates retain access
- Deactivation requires admin approval and justification

## Pricing Strategy

### Dynamic Pricing Model

#### Pricing Plan Structure
```python
class PricingPlan:
    """
    Business model for template pricing
    """
    def calculate_final_price(self, user=None, promo_code=None):
        """
        Calculate final price with business rules
        """
        base_price = self.price
        discount = 0
        
        # Early bird discount
        if self.has_early_bird_discount():
            discount += base_price * 0.10  # 10% early bird
        
        # User loyalty discount
        if user and user.is_premium_member():
            discount += base_price * 0.05  # 5% loyalty discount
        
        # Promo code discount
        if promo_code:
            promo_discount = self.apply_promo_code(promo_code)
            discount += promo_discount
        
        # Bulk purchase discount
        if user and user.get_template_purchase_count() >= 5:
            discount += base_price * 0.15  # 15% bulk discount
        
        final_price = max(0, base_price - discount)
        return {
            'base_price': base_price,
            'total_discount': discount,
            'final_price': final_price,
            'savings': discount
        }
```

#### Commission Structure
- **Basic Templates**: 10% platform commission
- **Premium Templates**: 15% platform commission  
- **Enterprise Templates**: 20% platform commission
- **Custom Templates**: Negotiated commission rates

### Package Upgrade Logic

#### Upgrade Eligibility
```python
def get_upgrade_options(user, event):
    """
    Business logic for package upgrades
    """
    current_payment = Payment.objects.filter(
        event=event,
        user=user,
        status='confirmed'
    ).first()
    
    if not current_payment:
        return get_all_available_packages()
    
    current_plan = current_payment.pricing_plan
    upgrade_options = []
    
    # Find higher-tier plans
    higher_plans = PricingPlan.objects.filter(
        price__gt=current_plan.price,
        category=current_plan.category,
        is_active=True
    )
    
    for plan in higher_plans:
        upgrade_cost = plan.price - current_plan.price
        if upgrade_cost > 0:
            upgrade_options.append({
                'plan': plan,
                'upgrade_cost': upgrade_cost,
                'savings': calculate_upgrade_savings(current_plan, plan)
            })
    
    return upgrade_options
```

## User Access Control

### Template Access Matrix

#### Access Levels
```python
class TemplateAccessLevel:
    FREE = 'free'           # No payment required
    BASIC = 'basic'         # One-time payment
    PREMIUM = 'premium'     # Premium subscription
    ENTERPRISE = 'enterprise'  # Enterprise license
```

#### Access Verification
```python
def can_user_access_template(user, template, event=None):
    """
    Comprehensive access control logic
    """
    # Public templates are always accessible
    if template.is_free():
        return True, "Free template access"
    
    # Check if user has valid payment for this template
    if event:
        payment = Payment.objects.filter(
            user=user,
            event=event,
            event_template=template,
            status='confirmed'
        ).first()
        
        if payment:
            return True, "Paid access confirmed"
    
    # Check subscription-based access
    if user.has_active_subscription():
        subscription = user.get_active_subscription()
        if template.package_plan in subscription.included_plans.all():
            return True, "Subscription access"
    
    # Check template sharing permissions
    if template.is_shared_with_user(user):
        return True, "Shared template access"
    
    return False, "Payment required for template access"
```

### Permission Inheritance
- **Event Organizers**: Full access to purchased templates for their events
- **Event Collaborators**: Read-only access to event's template
- **Event Viewers**: Preview access only
- **Admin Users**: Full access to all templates for management

## Payment Integration Logic

### Payment Workflow State Machine

#### Payment States
```python
class PaymentState:
    PENDING = 'pending'        # Initial state
    PROCESSING = 'processing'  # Under review
    CONFIRMED = 'confirmed'    # Approved
    REJECTED = 'rejected'      # Declined
    REFUNDED = 'refunded'     # Money returned
    EXPIRED = 'expired'       # Payment timeout
```

#### State Transitions
```python
def transition_payment_state(payment, new_state, user, notes=None):
    """
    Business logic for payment state transitions
    """
    current_state = payment.status
    valid_transitions = {
        'pending': ['processing', 'confirmed', 'rejected', 'expired'],
        'processing': ['confirmed', 'rejected'],
        'confirmed': ['refunded'],
        'rejected': ['pending'],  # User can retry
        'refunded': [],  # Final state
        'expired': ['pending']  # User can retry
    }
    
    if new_state not in valid_transitions.get(current_state, []):
        raise ValueError(f"Invalid transition from {current_state} to {new_state}")
    
    # Apply business rules for each transition
    if new_state == 'confirmed':
        handle_payment_confirmation(payment, user, notes)
    elif new_state == 'rejected':
        handle_payment_rejection(payment, user, notes)
    elif new_state == 'refunded':
        handle_payment_refund(payment, user, notes)
    
    # Update payment state
    payment.status = new_state
    payment.save()
    
    # Send notifications
    send_payment_status_notification(payment, new_state)
```

### Template Access Granting

#### Automatic Access Management
```python
def handle_payment_confirmation(payment, admin_user, notes):
    """
    Business logic when payment is confirmed
    """
    # 1. Grant template access
    grant_template_access(
        user=payment.user,
        template=payment.event_template,
        event=payment.event,
        payment=payment
    )
    
    # 2. Update event with template
    if payment.event and payment.event_template:
        payment.event.template = payment.event_template
        payment.event.save()
    
    # 3. Record payment confirmation
    payment.confirmed_at = timezone.now()
    payment.confirmed_by = admin_user
    payment.admin_notes = notes
    payment.save()
    
    # 4. Generate invoice
    generate_payment_invoice(payment)
    
    # 5. Update user statistics
    update_user_purchase_history(payment.user, payment)
    
    # 6. Track analytics
    track_template_purchase(payment.event_template, payment.pricing_plan)
```

## Template Customization Logic

### Color Palette Management

#### Color Scheme Validation
```python
def validate_template_colors(template, colors):
    """
    Business rules for template color schemes
    """
    required_color_types = ['primary', 'secondary', 'accent']
    provided_types = [color.color_type for color in colors]
    
    # Ensure required colors are provided
    for required_type in required_color_types:
        if required_type not in provided_types:
            raise ValidationError(f"Missing required color type: {required_type}")
    
    # Validate color accessibility
    for i, color1 in enumerate(colors):
        for color2 in colors[i+1:]:
            if not has_sufficient_contrast(color1.hex_code, color2.hex_code):
                raise ValidationError(f"Insufficient contrast between {color1.name} and {color2.name}")
    
    return True
```

### Font Management

#### Multi-language Font Support
```python
def setup_template_fonts(template, font_assignments):
    """
    Business logic for template font management
    """
    supported_languages = ['en', 'kh', 'fr', ja', 'ko', 'zh-cn', 'th', 'vn']
    
    for language in supported_languages:
        # Use provided font or fallback to default
        font_assignment = font_assignments.get(language)
        if not font_assignment:
            font_assignment = get_default_font_for_language(language)
        
        # Create or update template font
        TemplateFont.objects.update_or_create(
            event_template=template,
            language=language,
            defaults={'font': font_assignment}
        )
    
    # Validate font loading performance
    validate_font_performance(template)
```

## Template Analytics and Insights

### Usage Tracking

#### Template Performance Metrics
```python
def track_template_usage(template, event, user):
    """
    Business logic for template usage analytics
    """
    # Track template selection
    TemplateUsageLog.objects.create(
        template=template,
        event=event,
        user=user,
        action='selected',
        timestamp=timezone.now()
    )
    
    # Update template popularity score
    template.popularity_score = calculate_popularity_score(template)
    template.save()
    
    # Track conversion metrics
    if user.has_purchased_template(template):
        track_template_conversion(template, user)
```

#### Revenue Analytics
```python
def calculate_template_revenue(template, period='month'):
    """
    Business logic for template revenue calculation
    """
    start_date = get_period_start_date(period)
    
    payments = Payment.objects.filter(
        event_template=template,
        status='confirmed',
        confirmed_at__gte=start_date
    )
    
    revenue_data = {
        'total_revenue': sum(p.final_amount for p in payments),
        'total_sales': payments.count(),
        'average_sale': payments.aggregate(avg=Avg('final_amount'))['avg'] or 0,
        'commission_earned': sum(p.calculate_commission() for p in payments),
        'top_pricing_plan': get_most_popular_plan(payments)
    }
    
    return revenue_data
```

## Quality Assurance

### Template Review Process

#### Automated Quality Checks
```python
def perform_template_quality_check(template):
    """
    Automated quality assurance for templates
    """
    issues = []
    
    # Check asset quality
    if template.preview_image:
        image_quality = analyze_image_quality(template.preview_image)
        if image_quality < 0.7:
            issues.append("Preview image quality below standards")
    
    # Check color accessibility
    colors = template.template_colors.all()
    if not validate_color_accessibility(colors):
        issues.append("Color scheme fails accessibility standards")
    
    # Check font compatibility
    fonts = template.template_font_name.all()
    if not validate_font_compatibility(fonts):
        issues.append("Font compatibility issues detected")
    
    # Check template completeness
    completeness_score = calculate_template_completeness(template)
    if completeness_score < 0.8:
        issues.append(f"Template completeness: {completeness_score*100:.1f}%")
    
    return {
        'passed': len(issues) == 0,
        'issues': issues,
        'quality_score': calculate_overall_quality_score(template)
    }
```

### User Feedback Integration

#### Rating and Review System
```python
def process_template_feedback(template, user, rating, review_text):
    """
    Business logic for processing template feedback
    """
    # Create review record
    review = TemplateReview.objects.create(
        template=template,
        user=user,
        rating=rating,
        review_text=review_text,
        is_verified_purchase=user.has_purchased_template(template)
    )
    
    # Update template rating
    update_template_rating(template)
    
    # Alert template creator for low ratings
    if rating <= 2:
        alert_template_creator(template, review)
    
    # Track feedback trends
    track_feedback_trends(template, rating)
    
    return review
```

## Business Rules Summary

### Template Creation Rules
1. Templates must have unique names within the system
2. Paid templates must have associated pricing plans
3. All assets must pass security validation
4. Templates start inactive until admin approval

### Pricing Rules
1. Free templates are accessible to all users
2. Paid templates require payment confirmation for access
3. Upgrades are available within the same category
4. Commission rates vary by template tier

### Access Control Rules
1. Users can only access templates they've paid for
2. Event collaborators inherit organizer's template access
3. Subscription users get access to included templates
4. Admin users have full access for management

### Payment Rules
1. One payment per template per event
2. Payments expire after 7 days if not completed
3. Confirmed payments grant immediate template access
4. Refunds require admin approval and revoke access

### Quality Standards
1. Preview images must be high resolution (min 1200x800)
2. Color schemes must meet accessibility standards
3. Fonts must be compatible across all platforms
4. Templates must achieve 80% completeness score

## Integration Points

### External Systems
- **Payment Gateways**: Integration with bank transfer systems
- **Email Service**: Automated notifications for status changes
- **File Storage**: Secure asset storage with CDN
- **Analytics Platform**: Usage and revenue tracking

### Internal Systems
- **Event Management**: Template selection and application
- **User Management**: Access control and subscription handling
- **Notification System**: Real-time status updates
- **Admin Panel**: Template management and approval workflows

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Template assets loaded on demand
2. **Caching**: Popular templates cached for faster access
3. **Database Optimization**: Indexes on frequently queried fields
4. **Asset Compression**: Automatic image and video optimization

### Scalability Measures
1. **Horizontal Scaling**: Database read replicas for template browsing
2. **CDN Integration**: Global asset distribution
3. **Background Processing**: Asynchronous template processing
4. **Rate Limiting**: API protection against abuse

This business logic documentation serves as the foundation for understanding how the Event Template system operates within the GoEvent platform, ensuring consistent behavior and maintainable code architecture.