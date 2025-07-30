# Event Template Frontend Implementation Examples

This document provides complete, production-ready frontend code examples for implementing the Event Template system across different frameworks and use cases.

## Table of Contents

1. [React Implementation](#react-implementation)
2. [Vue.js Implementation](#vuejs-implementation)
3. [Vanilla JavaScript](#vanilla-javascript)
4. [CSS Template System](#css-template-system)
5. [Mobile App Examples](#mobile-app-examples)
6. [Testing Examples](#testing-examples)

## React Implementation

### Template Selection Component

```jsx
// TemplateSelector.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Spin, message } from 'antd';
import { useAuth } from '../hooks/useAuth';

const TemplateSelector = ({ eventId, onTemplateSelected }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { authToken } = useAuth();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/core-data/event-templates/browse_templates/', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      } else {
        message.error('Failed to load templates');
      }
    } catch (error) {
      message.error('Error loading templates');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = async (template) => {
    try {
      const response = await fetch(`/api/events/${eventId}/select_template/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ template_id: template.id })
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedTemplate(data);
        setShowPaymentModal(true);
      } else {
        const error = await response.json();
        message.error(error.error || 'Failed to select template');
      }
    } catch (error) {
      message.error('Error selecting template');
      console.error(error);
    }
  };

  const handlePayment = async (pricingInfo) => {
    // Integration with payment processor
    try {
      const paymentResult = await processStripePayment({
        amount: parseFloat(pricingInfo.price) * 100, // Convert to cents
        currency: 'usd',
        description: `Template: ${pricingInfo.plan_name}`,
        metadata: {
          eventId,
          templateId: selectedTemplate.template.id
        }
      });

      if (paymentResult.success) {
        message.success('Payment successful! Template will be enabled after verification.');
        setShowPaymentModal(false);
        onTemplateSelected(selectedTemplate.template);
      }
    } catch (error) {
      message.error('Payment failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Spin size="large" />
        <p className="mt-4">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="template-selector">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={() => selectTemplate(template)}
          />
        ))}
      </div>

      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        templateData={selectedTemplate}
        onPayment={handlePayment}
      />
    </div>
  );
};

const TemplateCard = ({ template, onSelect }) => {
  return (
    <Card
      cover={
        <img
          alt={template.name}
          src={template.preview_image}
          className="h-48 object-cover"
        />
      }
      actions={[
        <Button type="primary" onClick={onSelect}>
          Select Template - ${template.package_plan.price}
        </Button>
      ]}
    >
      <Card.Meta
        title={template.name}
        description={
          <div>
            <p className="text-lg font-semibold text-green-600 mb-2">
              ${template.package_plan.price}
            </p>
            <div className="flex flex-wrap gap-1 mb-3">
              {template.template_colors.map(color => (
                <div
                  key={color.id}
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: color.hex_color_code }}
                  title={color.name}
                />
              ))}
            </div>
            <ul className="text-sm text-gray-600">
              {template.package_plan.features.map((feature, index) => (
                <li key={index}>✓ {feature}</li>
              ))}
            </ul>
          </div>
        }
      />
    </Card>
  );
};

const PaymentModal = ({ visible, onClose, templateData, onPayment }) => {
  if (!templateData) return null;

  const { pricing_info } = templateData;

  return (
    <Modal
      title="Complete Template Purchase"
      visible={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="pay"
          type="primary"
          onClick={() => onPayment(pricing_info)}
        >
          Pay ${pricing_info.price}
        </Button>
      ]}
    >
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">{pricing_info.plan_name}</h3>
          <p className="text-2xl font-bold text-green-600">
            ${pricing_info.price}
          </p>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Included Features:</h4>
          <ul className="list-disc list-inside space-y-1">
            {pricing_info.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <p className="text-sm text-gray-600">
            After payment, your template will be reviewed and enabled within 24 hours.
            You'll receive an email confirmation once it's active.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default TemplateSelector;
```

### Public Event Showcase Component

```jsx
// EventShowcase.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const EventShowcase = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [templateAssets, setTemplateAssets] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventAndTemplate();
  }, [eventId]);

  const loadEventAndTemplate = async () => {
    try {
      // Load event details
      const eventResponse = await fetch(`/api/events/${eventId}/`);
      const eventData = await eventResponse.json();
      setEvent(eventData);

      // Load template assets if template is enabled
      if (eventData.event_template_enabled && eventData.event_template) {
        const templateResponse = await fetch(
          `/api/core-data/event-templates/${eventData.event_template}/public_template_assets/`
        );
        
        if (templateResponse.ok) {
          const templateData = await templateResponse.json();
          setTemplateAssets(templateData.template_data);
          applyTemplateStyles(templateData.template_data);
        }
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyTemplateStyles = (templateData) => {
    // Apply color palette as CSS variables
    templateData.colors.forEach((color, index) => {
      document.documentElement.style.setProperty(
        `--template-color-${index + 1}`,
        color.hex_color_code
      );
      
      // Named colors
      const colorName = color.name.toLowerCase().replace(/\s+/g, '-');
      document.documentElement.style.setProperty(
        `--template-${colorName}`,
        color.hex_color_code
      );
    });

    // Load custom fonts
    templateData.fonts.forEach(font => {
      if (font.font) {
        loadCustomFont(font.font.name, font.font.font_file, font.language);
      }
    });
  };

  const loadCustomFont = (fontName, fontUrl, language) => {
    const fontFace = new FontFace(fontName, `url(${fontUrl})`);
    fontFace.load().then(() => {
      document.fonts.add(fontFace);
      
      // Apply font to language-specific elements
      const langElements = document.querySelectorAll(`[lang="${language}"]`);
      langElements.forEach(el => {
        el.style.fontFamily = fontName;
      });
    });
  };

  if (loading) {
    return <div className="loading-spinner">Loading event...</div>;
  }

  if (!event) {
    return <div className="error-message">Event not found</div>;
  }

  return (
    <div className={`event-showcase ${templateAssets ? 'templated' : 'default'}`}>
      {/* Background Elements */}
      {templateAssets?.assets.basic_background_photo && (
        <div
          className="background-image"
          style={{
            backgroundImage: `url(${templateAssets.assets.basic_background_photo})`
          }}
        />
      )}
      
      {templateAssets?.assets.standard_background_video && (
        <video
          className="background-video"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={templateAssets.assets.standard_background_video} type="video/mp4" />
        </video>
      )}

      {/* Event Content */}
      <div className="event-content">
        <header className="event-header">
          {event.banner_image && (
            <img src={event.banner_image} alt={event.title} className="event-banner" />
          )}
          <h1 className="event-title">{event.title}</h1>
          <p className="event-description">{event.description}</p>
        </header>

        <div className="event-details">
          <div className="event-info">
            <p><strong>Date:</strong> {new Date(event.start_date).toLocaleDateString()}</p>
            <p><strong>Location:</strong> {event.location}</p>
            {event.is_virtual && (
              <p><strong>Virtual Event</strong></p>
            )}
          </div>

          {/* Template Decorations */}
          {templateAssets?.assets.basic_decoration_photo && (
            <img
              src={templateAssets.assets.basic_decoration_photo}
              alt="Decoration"
              className="template-decoration"
            />
          )}
        </div>

        {/* Event Hosts */}
        {event.hosts && event.hosts.length > 0 && (
          <section className="event-hosts">
            <h2>Hosts</h2>
            <div className="hosts-grid">
              {event.hosts.map(host => (
                <div key={host.id} className="host-card">
                  {host.profile_image && (
                    <img src={host.profile_image} alt={host.name} />
                  )}
                  <h3>{host.name}</h3>
                  <p>{host.title}</p>
                  <p>{host.bio}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Event Agenda */}
        {event.agenda_items && event.agenda_items.length > 0 && (
          <section className="event-agenda">
            <h2>Agenda</h2>
            <div className="agenda-timeline">
              {event.agenda_items.map(item => (
                <div key={item.id} className="agenda-item">
                  <div className="agenda-time">
                    {item.start_time_text} - {item.end_time_text}
                  </div>
                  <div className="agenda-content">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    {item.speaker && <p><strong>Speaker:</strong> {item.speaker}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Registration Section */}
        {event.registration_required && (
          <section className="event-registration">
            <h2>Register for Event</h2>
            <RegistrationForm eventId={event.id} />
          </section>
        )}

        {/* Template-specific Interactive Elements */}
        {templateAssets?.assets.open_envelope_button && (
          <div className="interactive-elements">
            <img
              src={templateAssets.assets.open_envelope_button}
              alt="Open Invitation"
              className="interactive-button"
              onClick={() => {
                // Custom interaction logic
                document.querySelector('.event-details').scrollIntoView({
                  behavior: 'smooth'
                });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const RegistrationForm = ({ eventId }) => {
  const [formData, setFormData] = useState({
    guest_count: 0,
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}/rsvp/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Registration successful!');
      } else {
        const error = await response.json();
        alert(error.error || 'Registration failed');
      }
    } catch (error) {
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="registration-form">
      <div className="form-group">
        <label htmlFor="guest_count">Number of Guests:</label>
        <input
          type="number"
          id="guest_count"
          min="0"
          max="10"
          value={formData.guest_count}
          onChange={(e) => setFormData({
            ...formData,
            guest_count: parseInt(e.target.value)
          })}
        />
      </div>

      <div className="form-group">
        <label htmlFor="notes">Additional Notes:</label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({
            ...formData,
            notes: e.target.value
          })}
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};

export default EventShowcase;
```

## Vue.js Implementation

### Template Management Component

```vue
<!-- TemplateManager.vue -->
<template>
  <div class="template-manager">
    <div class="template-header">
      <h2>Event Templates</h2>
      <button @click="openTemplateSelector" class="btn-primary">
        Select Template
      </button>
    </div>

    <div v-if="selectedTemplate" class="current-template">
      <h3>Current Template</h3>
      <div class="template-preview">
        <img :src="selectedTemplate.preview_image" :alt="selectedTemplate.name" />
        <div class="template-info">
          <h4>{{ selectedTemplate.name }}</h4>
          <p class="price">${{ selectedTemplate.package_plan.price }}</p>
          <div class="status-badge" :class="templateStatus">
            {{ templateStatusText }}
          </div>
        </div>
      </div>
    </div>

    <!-- Template Selector Modal -->
    <div v-if="showTemplateSelector" class="modal-overlay" @click="closeTemplateSelector">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Select Event Template</h3>
          <button @click="closeTemplateSelector" class="close-btn">&times;</button>
        </div>
        
        <div class="templates-grid">
          <div
            v-for="template in availableTemplates"
            :key="template.id"
            class="template-card"
            @click="selectTemplate(template)"
          >
            <img :src="template.preview_image" :alt="template.name" />
            <div class="template-card-content">
              <h4>{{ template.name }}</h4>
              <p class="price">${{ template.package_plan.price }}</p>
              <div class="color-palette">
                <span
                  v-for="color in template.template_colors"
                  :key="color.id"
                  class="color-dot"
                  :style="{ backgroundColor: color.hex_color_code }"
                  :title="color.name"
                ></span>
              </div>
              <ul class="features">
                <li v-for="feature in template.package_plan.features" :key="feature">
                  ✓ {{ feature }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Modal -->
    <PaymentModal
      v-if="showPaymentModal"
      :template-data="templateForPayment"
      @close="showPaymentModal = false"
      @payment-success="handlePaymentSuccess"
    />
  </div>
</template>

<script>
import PaymentModal from './PaymentModal.vue';

export default {
  name: 'TemplateManager',
  components: {
    PaymentModal
  },
  props: {
    eventId: {
      type: String,
      required: true
    },
    currentTemplate: {
      type: Object,
      default: null
    },
    templateEnabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      availableTemplates: [],
      selectedTemplate: this.currentTemplate,
      showTemplateSelector: false,
      showPaymentModal: false,
      templateForPayment: null,
      loading: false
    };
  },
  computed: {
    templateStatus() {
      if (!this.selectedTemplate) return '';
      if (this.templateEnabled) return 'enabled';
      return 'pending';
    },
    templateStatusText() {
      if (!this.selectedTemplate) return '';
      if (this.templateEnabled) return 'Active';
      return 'Pending Payment';
    }
  },
  methods: {
    async openTemplateSelector() {
      this.showTemplateSelector = true;
      await this.loadAvailableTemplates();
    },

    closeTemplateSelector() {
      this.showTemplateSelector = false;
    },

    async loadAvailableTemplates() {
      if (this.availableTemplates.length > 0) return;

      this.loading = true;
      try {
        const response = await fetch('/api/core-data/event-templates/browse_templates/', {
          headers: {
            'Authorization': `Bearer ${this.$store.state.auth.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          this.availableTemplates = data.templates;
        }
      } catch (error) {
        this.$toast.error('Failed to load templates');
        console.error(error);
      } finally {
        this.loading = false;
      }
    },

    async selectTemplate(template) {
      try {
        const response = await fetch(`/api/events/${this.eventId}/select_template/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.$store.state.auth.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ template_id: template.id })
        });

        if (response.ok) {
          const data = await response.json();
          this.templateForPayment = data;
          this.showTemplateSelector = false;
          this.showPaymentModal = true;
        } else {
          const error = await response.json();
          this.$toast.error(error.error || 'Failed to select template');
        }
      } catch (error) {
        this.$toast.error('Error selecting template');
        console.error(error);
      }
    },

    handlePaymentSuccess(template) {
      this.selectedTemplate = template;
      this.showPaymentModal = false;
      this.$emit('template-selected', template);
      this.$toast.success('Template selected! Payment processed successfully.');
    }
  }
};
</script>

<style scoped>
.template-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.current-template {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.template-preview {
  display: flex;
  gap: 20px;
  align-items: center;
}

.template-preview img {
  width: 200px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
}

.template-info h4 {
  margin: 0 0 10px 0;
  font-size: 1.2em;
}

.price {
  font-size: 1.5em;
  font-weight: bold;
  color: #28a745;
  margin: 0 0 10px 0;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9em;
  font-weight: bold;
}

.status-badge.enabled {
  background: #d4edda;
  color: #155724;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 90%;
  max-height: 90%;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.template-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.template-card img {
  width: 100%;
  height: 160px;
  object-fit: cover;
}

.template-card-content {
  padding: 15px;
}

.color-palette {
  display: flex;
  gap: 8px;
  margin: 10px 0;
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid #ccc;
}

.features {
  list-style: none;
  padding: 0;
  margin: 10px 0 0 0;
}

.features li {
  padding: 2px 0;
  font-size: 0.9em;
  color: #666;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
}

.btn-primary:hover {
  background: #0056b3;
}
</style>
```

## Vanilla JavaScript

### Complete Template System Implementation

```javascript
// templateSystem.js
class EventTemplateSystem {
  constructor(config) {
    this.apiBaseUrl = config.apiBaseUrl || '/api';
    this.authToken = config.authToken;
    this.eventId = config.eventId;
    this.callbacks = config.callbacks || {};
  }

  // Browse available templates
  async browseTemplates() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/core-data/event-templates/browse_templates/`, {
        headers: this.getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return data.templates;
      } else {
        throw new Error('Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error browsing templates:', error);
      throw error;
    }
  }

  // Select template for event
  async selectTemplate(templateId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/events/${this.eventId}/select_template/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ template_id: templateId })
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to select template');
      }
    } catch (error) {
      console.error('Error selecting template:', error);
      throw error;
    }
  }

  // Get public template assets
  async getTemplateAssets(templateId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/core-data/event-templates/${templateId}/public_template_assets/`);
      
      if (response.ok) {
        const data = await response.json();
        return data.template_data;
      } else {
        throw new Error('Template not found');
      }
    } catch (error) {
      console.error('Error fetching template assets:', error);
      return null;
    }
  }

  // Apply template styles to page
  applyTemplateStyles(templateData) {
    if (!templateData) return;

    // Apply color palette
    templateData.colors.forEach((color, index) => {
      document.documentElement.style.setProperty(
        `--template-color-${index + 1}`,
        color.hex_color_code
      );
      
      // Named colors
      const colorName = color.name.toLowerCase().replace(/\s+/g, '-');
      document.documentElement.style.setProperty(
        `--template-${colorName}`,
        color.hex_color_code
      );
    });

    // Load and apply custom fonts
    templateData.fonts.forEach(font => {
      if (font.font) {
        this.loadCustomFont(font.font.name, font.font.font_file, font.language);
      }
    });

    // Apply background assets
    this.applyBackgroundAssets(templateData.assets);
  }

  // Load custom fonts
  async loadCustomFont(fontName, fontUrl, language) {
    try {
      const fontFace = new FontFace(fontName, `url(${fontUrl})`);
      await fontFace.load();
      document.fonts.add(fontFace);
      
      // Apply to language-specific elements
      const langElements = document.querySelectorAll(`[lang="${language}"], .lang-${language}`);
      langElements.forEach(el => {
        el.style.fontFamily = `"${fontName}", sans-serif`;
      });

      if (this.callbacks.onFontLoaded) {
        this.callbacks.onFontLoaded(fontName, language);
      }
    } catch (error) {
      console.warn(`Failed to load font ${fontName}:`, error);
    }
  }

  // Apply background assets
  applyBackgroundAssets(assets) {
    if (!assets) return;

    // Background image
    if (assets.basic_background_photo) {
      const bgElement = document.querySelector('.template-background') || document.body;
      bgElement.style.backgroundImage = `url(${assets.basic_background_photo})`;
      bgElement.style.backgroundSize = 'cover';
      bgElement.style.backgroundPosition = 'center';
    }

    // Background video
    if (assets.standard_background_video) {
      this.setupBackgroundVideo(assets.standard_background_video);
    }

    // Decoration elements
    if (assets.basic_decoration_photo) {
      const decorElements = document.querySelectorAll('.template-decoration');
      decorElements.forEach(el => {
        el.src = assets.basic_decoration_photo;
      });
    }

    // Interactive buttons
    if (assets.open_envelope_button) {
      const buttonElements = document.querySelectorAll('.template-button');
      buttonElements.forEach(el => {
        el.src = assets.open_envelope_button;
      });
    }
  }

  // Setup background video
  setupBackgroundVideo(videoUrl) {
    let videoElement = document.querySelector('.template-bg-video');
    
    if (!videoElement) {
      videoElement = document.createElement('video');
      videoElement.className = 'template-bg-video';
      videoElement.autoplay = true;
      videoElement.muted = true;
      videoElement.loop = true;
      videoElement.playsInline = true;
      
      // Style the video
      Object.assign(videoElement.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        zIndex: '-1'
      });
      
      document.body.insertBefore(videoElement, document.body.firstChild);
    }
    
    videoElement.src = videoUrl;
  }

  // Render template selector UI
  renderTemplateSelector(containerId, templates) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="template-selector">
        <h3>Select Event Template</h3>
        <div class="templates-grid">
          ${templates.map(template => this.renderTemplateCard(template)).join('')}
        </div>
      </div>
    `;

    // Add event listeners
    container.addEventListener('click', (e) => {
      const templateCard = e.target.closest('.template-card');
      if (templateCard) {
        const templateId = parseInt(templateCard.dataset.templateId);
        const template = templates.find(t => t.id === templateId);
        this.handleTemplateSelection(template);
      }
    });
  }

  // Render individual template card
  renderTemplateCard(template) {
    return `
      <div class="template-card" data-template-id="${template.id}">
        <img src="${template.preview_image}" alt="${template.name}" />
        <div class="template-card-content">
          <h4>${template.name}</h4>
          <p class="price">$${template.package_plan.price}</p>
          <div class="color-palette">
            ${template.template_colors.map(color => 
              `<span class="color-dot" style="background-color: ${color.hex_color_code}" title="${color.name}"></span>`
            ).join('')}
          </div>
          <ul class="features">
            ${template.package_plan.features.map(feature => `<li>✓ ${feature}</li>`).join('')}
          </ul>
          <button class="select-btn">Select Template</button>
        </div>
      </div>
    `;
  }

  // Handle template selection
  async handleTemplateSelection(template) {
    try {
      const result = await this.selectTemplate(template.id);
      
      if (this.callbacks.onTemplateSelected) {
        this.callbacks.onTemplateSelected(result);
      }
      
      // Show payment modal or redirect to payment
      this.showPaymentModal(result);
    } catch (error) {
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    }
  }

  // Show payment modal
  showPaymentModal(templateData) {
    const modal = document.createElement('div');
    modal.className = 'payment-modal-overlay';
    modal.innerHTML = `
      <div class="payment-modal">
        <div class="modal-header">
          <h3>Complete Template Purchase</h3>
          <button class="close-btn">&times;</button>
        </div>
        <div class="modal-content">
          <div class="template-summary">
            <h4>${templateData.pricing_info.plan_name}</h4>
            <p class="price">$${templateData.pricing_info.price}</p>
          </div>
          <div class="features-list">
            <h5>Included Features:</h5>
            <ul>
              ${templateData.pricing_info.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
          </div>
          <div class="payment-info">
            <p>After payment, your template will be reviewed and enabled within 24 hours.</p>
          </div>
          <div class="modal-actions">
            <button class="cancel-btn">Cancel</button>
            <button class="pay-btn">Pay $${templateData.pricing_info.price}</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('.close-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('.cancel-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('.pay-btn').addEventListener('click', () => {
      this.processPayment(templateData.pricing_info);
      document.body.removeChild(modal);
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  // Process payment (integrate with your payment processor)
  async processPayment(pricingInfo) {
    try {
      // Example Stripe integration
      const paymentIntent = await this.createPaymentIntent({
        amount: Math.round(parseFloat(pricingInfo.price) * 100), // Convert to cents
        currency: 'usd',
        description: `Template: ${pricingInfo.plan_name}`,
        metadata: {
          eventId: this.eventId,
          planName: pricingInfo.plan_name
        }
      });

      // Process payment with Stripe Elements or redirect to payment page
      // This would typically involve Stripe.js or similar
      
      if (this.callbacks.onPaymentSuccess) {
        this.callbacks.onPaymentSuccess(pricingInfo);
      }
    } catch (error) {
      if (this.callbacks.onPaymentError) {
        this.callbacks.onPaymentError(error);
      }
    }
  }

  // Helper method to create payment intent
  async createPaymentIntent(paymentData) {
    const response = await fetch('/api/payments/create-intent/', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(paymentData)
    });

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to create payment intent');
    }
  }

  // Get authentication headers
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    };
  }
}

// Usage example
document.addEventListener('DOMContentLoaded', async () => {
  const templateSystem = new EventTemplateSystem({
    apiBaseUrl: '/api',
    authToken: localStorage.getItem('authToken'),
    eventId: 'your-event-id',
    callbacks: {
      onTemplateSelected: (result) => {
        console.log('Template selected:', result);
      },
      onPaymentSuccess: (pricingInfo) => {
        alert('Payment successful! Template will be enabled soon.');
      },
      onPaymentError: (error) => {
        alert('Payment failed: ' + error.message);
      },
      onError: (error) => {
        alert('Error: ' + error.message);
      },
      onFontLoaded: (fontName, language) => {
        console.log(`Font ${fontName} loaded for ${language}`);
      }
    }
  });

  // For template selection page
  if (document.getElementById('template-selector')) {
    try {
      const templates = await templateSystem.browseTemplates();
      templateSystem.renderTemplateSelector('template-selector', templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }

  // For event showcase page
  if (document.querySelector('.event-showcase')) {
    const eventId = new URLSearchParams(window.location.search).get('id');
    const templateId = document.body.dataset.templateId;
    
    if (templateId) {
      try {
        const templateAssets = await templateSystem.getTemplateAssets(templateId);
        templateSystem.applyTemplateStyles(templateAssets);
      } catch (error) {
        console.warn('Failed to load template assets, using default styling');
      }
    }
  }
});
```

## CSS Template System

### Template-Aware Styles

```css
/* template-styles.css */

/* Base template variables */
:root {
  /* Default colors that will be overridden by templates */
  --template-primary: #3498db;
  --template-secondary: #2ecc71;
  --template-accent: #e74c3c;
  --template-background: #ffffff;
  --template-text: #333333;
  
  /* Template-specific font families */
  --template-font-primary: 'Helvetica Neue', sans-serif;
  --template-font-secondary: 'Georgia', serif;
  --template-font-accent: 'Arial', sans-serif;
}

/* Template-aware component styles */
.event-showcase {
  font-family: var(--template-font-primary);
  background-color: var(--template-background);
  color: var(--template-text);
  min-height: 100vh;
  position: relative;
}

.event-showcase.templated {
  /* Enhanced styles when template is active */
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}

/* Background video styles */
.template-bg-video {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
}

/* Template color system */
.template-primary { color: var(--template-color-1, var(--template-primary)); }
.template-secondary { color: var(--template-color-2, var(--template-secondary)); }
.template-accent { color: var(--template-color-3, var(--template-accent)); }

.bg-template-primary { background-color: var(--template-color-1, var(--template-primary)); }
.bg-template-secondary { background-color: var(--template-color-2, var(--template-secondary)); }
.bg-template-accent { background-color: var(--template-color-3, var(--template-accent)); }

/* Template typography system */
.template-heading {
  font-family: var(--template-font-primary);
  color: var(--template-primary-red, var(--template-color-1));
  margin-bottom: 1rem;
}

.template-subheading {
  font-family: var(--template-font-secondary);
  color: var(--template-accent-teal, var(--template-color-2));
  margin-bottom: 0.75rem;
}

.template-body {
  font-family: var(--template-font-primary);
  line-height: 1.6;
}

/* Event showcase specific styles */
.event-header {
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(
    135deg,
    var(--template-color-1, var(--template-primary)) 0%,
    var(--template-color-2, var(--template-secondary)) 100%
  );
  color: white;
  position: relative;
  overflow: hidden;
}

.event-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1;
}

.event-header > * {
  position: relative;
  z-index: 2;
}

.event-title {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;
  font-family: var(--template-font-primary);
}

.event-description {
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto;
  opacity: 0.95;
}

/* Template decorations */
.template-decoration {
  position: absolute;
  max-width: 200px;
  opacity: 0.7;
  z-index: 1;
}

.template-decoration.top-left {
  top: 20px;
  left: 20px;
}

.template-decoration.top-right {
  top: 20px;
  right: 20px;
}

.template-decoration.bottom-left {
  bottom: 20px;
  left: 20px;
}

.template-decoration.bottom-right {
  bottom: 20px;
  right: 20px;
}

/* Interactive elements */
.template-button,
.interactive-button {
  cursor: pointer;
  transition: transform 0.3s ease, filter 0.3s ease;
  max-width: 150px;
  margin: 2rem auto;
  display: block;
}

.template-button:hover,
.interactive-button:hover {
  transform: scale(1.05);
  filter: brightness(1.1);
}

/* Template-aware cards */
.template-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 2rem;
  margin: 1rem 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.template-card h3 {
  color: var(--template-color-1, var(--template-primary));
  border-bottom: 2px solid var(--template-color-2, var(--template-secondary));
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

/* Host cards with template styling */
.hosts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.host-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.host-card:hover {
  transform: translateY(-5px);
}

.host-card img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 1rem;
  border: 4px solid var(--template-color-1, var(--template-primary));
}

.host-card h3 {
  color: var(--template-color-1, var(--template-primary));
  margin-bottom: 0.5rem;
}

.host-card p:first-of-type {
  color: var(--template-color-2, var(--template-secondary));
  font-weight: bold;
  margin-bottom: 1rem;
}

/* Agenda timeline with template styling */
.agenda-timeline {
  position: relative;
  padding-left: 2rem;
}

.agenda-timeline::before {
  content: '';
  position: absolute;
  left: 1rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(
    to bottom,
    var(--template-color-1, var(--template-primary)),
    var(--template-color-2, var(--template-secondary))
  );
}

.agenda-item {
  position: relative;
  margin-bottom: 2rem;
  padding-left: 2rem;
}

.agenda-item::before {
  content: '';
  position: absolute;
  left: -0.5rem;
  top: 0.5rem;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: var(--template-color-1, var(--template-primary));
  border: 3px solid white;
  box-shadow: 0 0 0 3px var(--template-color-2, var(--template-secondary));
}

.agenda-time {
  background: var(--template-color-1, var(--template-primary));
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  display: inline-block;
  font-weight: bold;
  margin-bottom: 1rem;
}

.agenda-content h3 {
  color: var(--template-color-1, var(--template-primary));
  margin-bottom: 0.5rem;
}

/* Registration form with template styling */
.registration-form {
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 15px;
  max-width: 500px;
  margin: 2rem auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: var(--template-color-1, var(--template-primary));
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--template-color-2, var(--template-secondary));
}

.registration-form button {
  background: linear-gradient(
    135deg,
    var(--template-color-1, var(--template-primary)),
    var(--template-color-2, var(--template-secondary))
  );
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  transition: transform 0.3s ease;
}

.registration-form button:hover:not(:disabled) {
  transform: translateY(-2px);
}

.registration-form button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive template styles */
@media (max-width: 768px) {
  .event-title {
    font-size: 2rem;
  }
  
  .event-header {
    padding: 2rem 1rem;
  }
  
  .hosts-grid {
    grid-template-columns: 1fr;
  }
  
  .template-decoration {
    max-width: 100px;
  }
  
  .agenda-timeline {
    padding-left: 1rem;
  }
  
  .agenda-item {
    padding-left: 1rem;
  }
}

/* Animation classes for template elements */
@keyframes templateFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.template-animate {
  animation: templateFadeIn 0.6s ease-out forwards;
}

.template-animate-delay-1 { animation-delay: 0.1s; }
.template-animate-delay-2 { animation-delay: 0.2s; }
.template-animate-delay-3 { animation-delay: 0.3s; }

/* Print styles for template events */
@media print {
  .template-bg-video,
  .template-decoration,
  .interactive-button {
    display: none !important;
  }
  
  .event-showcase {
    background: white !important;
    color: black !important;
  }
  
  .template-card {
    background: white !important;
    box-shadow: none !important;
    border: 1px solid #ccc !important;
  }
}
```

## Mobile App Examples

### React Native Implementation

```javascript
// EventTemplateManager.js (React Native)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EventTemplateManager = ({ eventId, navigation }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    loadAuthToken();
  }, []);

  useEffect(() => {
    if (authToken) {
      loadTemplates();
    }
  }, [authToken]);

  const loadAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      setAuthToken(token);
    } catch (error) {
      console.error('Error loading auth token:', error);
    }
  };

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/core-data/event-templates/browse_templates/', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      } else {
        Alert.alert('Error', 'Failed to load templates');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error loading templates');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = async (template) => {
    try {
      const response = await fetch(`/api/events/${eventId}/select_template/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ template_id: template.id })
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedTemplate(data);
        setShowPaymentModal(true);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to select template');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error selecting template');
      console.error(error);
    }
  };

  const handlePayment = () => {
    // Navigate to payment screen or integrate with payment SDK
    navigation.navigate('Payment', {
      templateData: selectedTemplate,
      eventId: eventId,
      onPaymentSuccess: () => {
        setShowPaymentModal(false);
        Alert.alert('Success', 'Template selected and payment processed!');
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading templates...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Event Template</Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {templates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={() => selectTemplate(template)}
          />
        ))}
      </ScrollView>

      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        templateData={selectedTemplate}
        onPayment={handlePayment}
      />
    </View>
  );
};

const TemplateCard = ({ template, onSelect }) => {
  return (
    <View style={styles.templateCard}>
      <Image
        source={{ uri: template.preview_image }}
        style={styles.templateImage}
        resizeMode="cover"
      />
      <View style={styles.templateInfo}>
        <Text style={styles.templateName}>{template.name}</Text>
        <Text style={styles.templatePrice}>${template.package_plan.price}</Text>
        
        <View style={styles.colorPalette}>
          {template.template_colors.map(color => (
            <View
              key={color.id}
              style={[
                styles.colorDot,
                { backgroundColor: color.hex_color_code }
              ]}
            />
          ))}
        </View>

        <View style={styles.features}>
          {template.package_plan.features.slice(0, 3).map((feature, index) => (
            <Text key={index} style={styles.featureText}>
              ✓ {feature}
            </Text>
          ))}
        </View>

        <TouchableOpacity style={styles.selectButton} onPress={onSelect}>
          <Text style={styles.selectButtonText}>
            Select Template - ${template.package_plan.price}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const PaymentModal = ({ visible, onClose, templateData, onPayment }) => {
  if (!templateData) return null;

  const { pricing_info } = templateData;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Complete Purchase</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.templateSummary}>
            <Text style={styles.planName}>{pricing_info.plan_name}</Text>
            <Text style={styles.planPrice}>${pricing_info.price}</Text>
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Included Features:</Text>
            {pricing_info.features.map((feature, index) => (
              <Text key={index} style={styles.featureItem}>
                • {feature}
              </Text>
            ))}
          </View>

          <View style={styles.paymentInfo}>
            <Text style={styles.paymentInfoText}>
              After payment, your template will be reviewed and enabled within 24 hours.
              You'll receive a notification once it's active.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.payButton} onPress={onPayment}>
            <Text style={styles.payButtonText}>Pay ${pricing_info.price}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  templateCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  templateImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  templateInfo: {
    padding: 16,
  },
  templateName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  templatePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 12,
  },
  colorPalette: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  features: {
    marginBottom: 16,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  selectButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  templateSummary: {
    alignItems: 'center',
    marginBottom: 24,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#28a745',
  },
  featuresSection: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  featureItem: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  paymentInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  paymentInfoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  payButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#007bff',
    borderRadius: 8,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default EventTemplateManager;
```

## Testing Examples

### Jest Unit Tests

```javascript
// __tests__/EventTemplateSystem.test.js
import { EventTemplateSystem } from '../src/utils/EventTemplateSystem';

// Mock fetch
global.fetch = jest.fn();

describe('EventTemplateSystem', () => {
  let templateSystem;
  const mockConfig = {
    apiBaseUrl: '/api',
    authToken: 'mock-token',
    eventId: 'mock-event-id'
  };

  beforeEach(() => {
    templateSystem = new EventTemplateSystem(mockConfig);
    fetch.mockClear();
  });

  describe('browseTemplates', () => {
    it('should fetch templates successfully', async () => {
      const mockTemplates = [
        {
          id: 1,
          name: 'Wedding Template',
          preview_image: 'image.jpg',
          package_plan: { price: '299.00' }
        }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ templates: mockTemplates })
      });

      const result = await templateSystem.browseTemplates();

      expect(fetch).toHaveBeenCalledWith('/api/core-data/event-templates/browse_templates/', {
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        }
      });
      expect(result).toEqual(mockTemplates);
    });

    it('should handle fetch errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(templateSystem.browseTemplates()).rejects.toThrow('Failed to fetch templates');
    });
  });

  describe('selectTemplate', () => {
    it('should select template successfully', async () => {
      const mockResponse = {
        message: 'Template selected successfully',
        template: { id: 1, name: 'Wedding Template' },
        pricing_info: { price: '299.00' }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await templateSystem.selectTemplate(1);

      expect(fetch).toHaveBeenCalledWith('/api/events/mock-event-id/select_template/', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ template_id: 1 })
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle selection errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Permission denied' })
      });

      await expect(templateSystem.selectTemplate(1)).rejects.toThrow('Permission denied');
    });
  });

  describe('getTemplateAssets', () => {
    it('should fetch public template assets', async () => {
      const mockAssets = {
        template_data: {
          colors: [{ hex_color_code: '#ff0000' }],
          fonts: [],
          assets: {}
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAssets
      });

      const result = await templateSystem.getTemplateAssets(1);

      expect(fetch).toHaveBeenCalledWith('/api/core-data/event-templates/1/public_template_assets/');
      expect(result).toEqual(mockAssets.template_data);
    });

    it('should return null for failed requests', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await templateSystem.getTemplateAssets(999);
      expect(result).toBeNull();
    });
  });

  describe('applyTemplateStyles', () => {
    let mockDocumentElement;

    beforeEach(() => {
      mockDocumentElement = {
        style: {
          setProperty: jest.fn()
        }
      };
      
      // Mock document
      global.document = {
        documentElement: mockDocumentElement,
        fonts: {
          add: jest.fn()
        },
        querySelectorAll: jest.fn(() => [])
      };
    });

    it('should apply color styles', () => {
      const templateData = {
        colors: [
          { hex_color_code: '#ff0000', name: 'Primary Red' },
          { hex_color_code: '#00ff00', name: 'Secondary Green' }
        ],
        fonts: [],
        assets: {}
      };

      templateSystem.applyTemplateStyles(templateData);

      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
        '--template-color-1',
        '#ff0000'
      );
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
        '--template-primary-red',
        '#ff0000'
      );
    });

    it('should handle null template data gracefully', () => {
      templateSystem.applyTemplateStyles(null);
      expect(mockDocumentElement.style.setProperty).not.toHaveBeenCalled();
    });
  });
});
```

### Cypress E2E Tests

```javascript
// cypress/integration/template-system.spec.js
describe('Event Template System', () => {
  beforeEach(() => {
    // Login as organizer
    cy.login('organizer@test.com', 'password');
    cy.visit('/events/test-event-id/templates');
  });

  describe('Template Selection', () => {
    it('should display available templates', () => {
      cy.get('[data-cy=template-selector]').should('be.visible');
      cy.get('[data-cy=template-card]').should('have.length.greaterThan', 0);
      
      // Check template card content
      cy.get('[data-cy=template-card]').first().within(() => {
        cy.get('img').should('be.visible');
        cy.get('[data-cy=template-name]').should('not.be.empty');
        cy.get('[data-cy=template-price]').should('contain', '$');
        cy.get('[data-cy=color-palette]').should('be.visible');
        cy.get('[data-cy=features-list]').should('be.visible');
      });
    });

    it('should allow template selection', () => {
      cy.get('[data-cy=template-card]').first().click();
      
      // Payment modal should appear
      cy.get('[data-cy=payment-modal]').should('be.visible');
      cy.get('[data-cy=payment-modal]').within(() => {
        cy.get('[data-cy=plan-name]').should('not.be.empty');
        cy.get('[data-cy=plan-price]').should('contain', '$');
        cy.get('[data-cy=features-list]').should('be.visible');
        cy.get('[data-cy=pay-button]').should('be.enabled');
      });
    });

    it('should handle payment flow', () => {
      cy.intercept('POST', '/api/events/*/select_template/', {
        statusCode: 200,
        body: {
          message: 'Template selected successfully',
          template: { id: 1, name: 'Test Template' },
          pricing_info: { price: '299.00', plan_name: 'Premium Plan' }
        }
      }).as('selectTemplate');

      cy.get('[data-cy=template-card]').first().click();
      cy.get('[data-cy=pay-button]').click();
      
      cy.wait('@selectTemplate');
      
      // Should redirect to payment processor or show success
      cy.url().should('include', '/payment');
      // OR
      cy.get('[data-cy=success-message]').should('contain', 'Template selected');
    });

    it('should handle selection errors', () => {
      cy.intercept('POST', '/api/events/*/select_template/', {
        statusCode: 403,
        body: { error: 'Permission denied' }
      }).as('selectTemplateError');

      cy.get('[data-cy=template-card]').first().click();
      
      cy.wait('@selectTemplateError');
      cy.get('[data-cy=error-message]').should('contain', 'Permission denied');
    });
  });

  describe('Template Preview', () => {
    it('should show template preview correctly', () => {
      cy.get('[data-cy=template-card]').first().within(() => {
        cy.get('[data-cy=preview-button]').click();
      });

      cy.get('[data-cy=preview-modal]').should('be.visible');
      cy.get('[data-cy=preview-modal]').within(() => {
        cy.get('img').should('be.visible');
        cy.get('[data-cy=color-samples]').should('be.visible');
        cy.get('[data-cy=font-samples]').should('be.visible');
      });
    });
  });

  describe('Public Event Showcase', () => {
    it('should display templated event correctly', () => {
      // Visit public event page with template
      cy.visit('/events/templated-event-id/showcase');
      
      // Check if template styles are applied
      cy.get('.event-showcase').should('have.class', 'templated');
      
      // Verify template elements
      cy.get('.template-decoration').should('be.visible');
      cy.get('.interactive-button').should('be.visible');
      
      // Check if custom colors are applied
      cy.get('.event-header').should('have.css', 'background-color');
      
      // Verify interactive elements work
      cy.get('.interactive-button').click();
      cy.get('.event-details').should('be.visible');
    });

    it('should gracefully handle missing template assets', () => {
      cy.intercept('GET', '/api/core-data/event-templates/*/public_template_assets/', {
        statusCode: 404
      }).as('getTemplateAssets');

      cy.visit('/events/test-event-id/showcase');
      
      // Should still display event without template styling
      cy.get('.event-showcase').should('be.visible');
      cy.get('.event-title').should('not.be.empty');
      
      // Should not have template-specific classes
      cy.get('.event-showcase').should('not.have.class', 'templated');
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('should display templates correctly on mobile', () => {
      cy.get('[data-cy=template-selector]').should('be.visible');
      cy.get('[data-cy=template-card]').should('be.visible');
      
      // Template cards should stack vertically
      cy.get('[data-cy=template-card]')
        .should('have.css', 'width')
        .and('match', /^\d+px$/);
    });

    it('should handle mobile payment modal', () => {
      cy.get('[data-cy=template-card]').first().click();
      
      cy.get('[data-cy=payment-modal]').should('be.visible');
      cy.get('[data-cy=payment-modal]').should('have.css', 'width', '100%');
    });
  });
});
```

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "content": "Create API endpoints reference documentation", "status": "completed", "priority": "high"}, {"id": "2", "content": "Create integration guide with workflows", "status": "completed", "priority": "high"}, {"id": "3", "content": "Create frontend implementation examples", "status": "completed", "priority": "medium"}]