import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, Phone, EnvelopeSimple, InstagramLogo, ArrowSquareOut, Check, Upload, Sparkle, Sun, Moon } from "phosphor-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { insertBookingSchema, type InsertBooking } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/components/theme-provider";
import { CancellationPolicyModal } from "@/components/CancellationPolicyModal";
import qrCodeImage from "@/assets/qr-code.png";

interface ContentItem {
  id: string;
  key: string;
  title: string;
  content: string;
}

export default function Home() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");
  const [isEarlyBird, setIsEarlyBird] = useState(true);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [hasPolicyBeenRead, setHasPolicyBeenRead] = useState(false);
  const [content, setContent] = useState<ContentItem[]>([]);

  // Load dynamic content
  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch('/api/content/public');
        if (response.ok) {
          const data = await response.json();
          setContent(data);
        }
      } catch (error) {
        console.error('Failed to load content:', error);
      }
    };
    loadContent();
  }, []);

  // Helper function to get content by key
  const getContent = (key: string, fallback: string = '') => {
    const item = content.find(c => c.key === key);
    return item ? item.content : fallback;
  };

  // Calculate if early bird pricing is still available
  useEffect(() => {
    const earlyBirdDeadline = new Date("2025-08-30");
    const now = new Date();
    setIsEarlyBird(now <= earlyBirdDeadline);
  }, []);

  const form = useForm<InsertBooking>({
    resolver: zodResolver(insertBookingSchema),
    mode: "onChange", // Validate on change
    defaultValues: {
      fullName: "",
      telephone: "",
      email: "",
      receiptPath: "",
      earlyBirdConfirmed: false,
      cancellationPolicyAccepted: false,
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: InsertBooking) => {
      console.log('Submitting booking:', data);
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to submit booking');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Confirmed",
        description: "Your booking has been submitted successfully!",
      });
      setIsSuccessModalOpen(true);
      form.reset();
      setUploadedFileUrl("");
    },
    onError: (error: any) => {
      console.error("Booking mutation error:", error);
      toast({
        title: "Booking Failed", 
        description: error.message || "Please check your internet connection and try again.",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    // Generate a temporary booking ID for file organization
    const tempBookingId = crypto.randomUUID();
    const response = await apiRequest("POST", "/api/receipts/upload", {
      bookingId: tempBookingId
    });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const fileUrl = uploadedFile.uploadURL;
      if (fileUrl) {
        // Convert GCS URL to our proxy endpoint for proper image preview
        const proxyUrl = fileUrl.includes('storage.googleapis.com') 
          ? `/api/receipt-preview?url=${encodeURIComponent(fileUrl)}`
          : fileUrl;
        
        setUploadedFileUrl(proxyUrl);
        form.setValue("receiptPath", fileUrl); // Store original URL for backend
        
        toast({
          title: "Receipt Uploaded",
          description: "Your payment receipt has been uploaded successfully.",
        });
      }
    }
  };

  const onSubmit = (data: InsertBooking) => {
    console.log("Form submitted with data:", data);
    
    // Check for validation errors
    const errors = form.formState.errors;
    if (Object.keys(errors).length > 0) {
      console.log("Form validation errors:", errors);
      toast({
        title: "Please Fix Form Errors",
        description: "Check the form fields for validation errors.",
        variant: "destructive",
      });
      return;
    }
    
    if (!uploadedFileUrl || !data.receiptPath) {
      toast({
        title: "Receipt Required",
        description: "Please upload your payment receipt before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!hasPolicyBeenRead) {
      setIsPolicyModalOpen(true);
      return;
    }

    // Use the original URL stored in the form, not the proxy URL
    const bookingData = {
      ...data,
      receiptPath: data.receiptPath, // This should be the original GCS URL
    };
    
    console.log("Submitting booking:", bookingData);
    createBookingMutation.mutate(bookingData);
  };

  // Generate Google Forms URL with pre-filled customer data
  const generateGoogleFormsURL = (data: InsertBooking) => {
    // Your actual Google Forms ID
    const GOOGLE_FORMS_ID = '1FAIpQLSftndGgCU1ag_EPX_eRkH0Amhi5ictUx_VBY08RMm7jUKgMmA';
    
    const baseURL = `https://docs.google.com/forms/d/e/${GOOGLE_FORMS_ID}/viewform`;
    
    const params = new URLSearchParams({
      // Actual entry IDs from your Google Form
      'entry.572192367': data.fullName,           // Full Name field
      'entry.1087676696': data.email,             // Email field  
      'entry.1864582825': data.telephone,         // Phone field
      // Add more fields if you have them in your form
    });
    
    return `${baseURL}?${params.toString()}`;
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-black" data-testid="brand-logo">Tonelab</h1>
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex space-x-6">
                <button 
                  onClick={() => scrollToSection("event")}
                  className="text-gray-600 hover:text-black transition-colors"
                  data-testid="nav-event-info"
                >
                  Event Info
                </button>
                <button 
                  onClick={() => scrollToSection("booking")}
                  className="text-gray-600 hover:text-black transition-colors"
                  data-testid="nav-book-now"
                >
                  Book Now
                </button>
                <button 
                  onClick={() => scrollToSection("contact")}
                  className="text-gray-600 hover:text-black transition-colors"
                  data-testid="nav-contact"
                >
                  Contact
                </button>
                <a 
                  href="/admin/login"
                  className="text-gray-600 hover:text-black transition-colors"
                  data-testid="nav-staff"
                >
                  Staff
                </a>
              </nav>
              

            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gray-50 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left animate-fade-in">
              <h2 className="text-4xl md:text-5xl font-bold text-black mb-6 leading-tight" data-testid="hero-title">
                {getContent('hero_title', 'Tune Your Tone with Tonelab')} <Sparkle className="inline text-3xl text-gray-800" weight="fill" />
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed" data-testid="hero-description">
                {getContent('hero_description', 'Join us for an exclusive Pilates experience that combines traditional techniques with modern fitness innovation.')}
              </p>
              <button 
                className="bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-full font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg border-0 cursor-pointer"
                onClick={() => scrollToSection("booking")}
                data-testid="button-hero-book"
                style={{ 
                  color: 'white',
                  backgroundColor: '#000000',
                  fontSize: '1.125rem',
                  fontWeight: '600'
                }}
              >
                Book Your Spot
              </button>
            </div>
            <div className="relative">
              <img 
                src={getContent('hero_image', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=800').startsWith('/objects/') 
                  ? getContent('hero_image', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=800') 
                  : getContent('hero_image', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=800')} 
                alt="Woman practicing Pilates in a modern, bright studio with natural light" 
                className="rounded-2xl shadow-2xl w-full h-auto"
                data-testid="img-hero"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Event Details */}
      <section id="event" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardContent className="p-8 md:p-12">
              <h3 className="text-3xl md:text-4xl font-bold text-center mb-12 text-black" data-testid="text-event-title">
                {getContent('event_title', 'Pilates Full Body Sculpt & Burn')}
              </h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Benefits Section */}
                <Card className="bg-white border border-gray-200 shadow-md">
                  <CardContent className="p-6">
                    <h4 className="text-xl font-semibold mb-6 text-black flex items-center">
                      <Check className="mr-3 text-gray-600" size={20} />
                      Benefits
                    </h4>
                    <div className="space-y-4">
                      <div 
                        className="text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: getContent('benefits_content', 
                            '<div class="flex items-start mb-4"><svg class="text-gray-600 mt-1 mr-3 flex-shrink-0 w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg><p><strong>Muscle Toning and Strengthening:</strong> Sculpting exercises with weights and resistance bands to build lean muscle mass and improve muscle definition.</p></div><div class="flex items-start mb-4"><svg class="text-gray-600 mt-1 mr-3 flex-shrink-0 w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg><p><strong>Cardio improvement:</strong> Utilizing time-under-tension throughout training to ensure maximum muscle exertion while maintaining flexibility.</p></div><div class="flex items-start"><svg class="text-gray-600 mt-1 mr-3 flex-shrink-0 w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg><p>A good option for individuals with joint sensitivities or those seeking a gentler approach to fitness.</p></div>'
                          )
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Event Info */}
                <Card className="bg-white border border-gray-200 shadow-md">
                  <CardContent className="p-6">
                    <h4 className="text-xl font-semibold mb-6 text-black flex items-center">
                      <Calendar className="mr-3 text-gray-600" size={20} />
                      Event Details
                    </h4>
                    <div className="space-y-4">
                      <div 
                        className="text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: getContent('event_details', 
                            '<div class="flex items-center mb-4"><svg class="text-gray-600 mr-3 w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path></svg><span>Sunday, 19th January 2025</span></div><div class="flex items-start mb-4"><svg class="text-gray-600 mr-3 mt-1 flex-shrink-0 w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path></svg><div><div>09:00–09:30 | Registration</div><div>09:30-10:30 | Pilates Full Body Sculpt & Burn</div><div>09:30-10:30 | Enjoy the Afterburn & Stay Photogenic</div></div></div><div class="flex items-center"><svg class="text-gray-600 mr-3 w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg><span>Asoke Sports Club (Free parking available)</span></div>'
                          )
                        }}
                      />
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-2" data-testid="price-early-bird">
                          <span className={`text-sm font-medium ${isEarlyBird ? 'text-green-600' : 'text-gray-400'}`}>
                            Early Bird (Before 30 Aug 2025)
                          </span>
                          <span className={`text-2xl font-bold ${isEarlyBird ? 'text-green-600' : 'text-gray-400'}`}>
                            {getContent('early_bird_price', '฿890')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center" data-testid="price-at-door">
                          <span className="text-sm text-gray-600">At the door</span>
                          <span className="text-xl text-gray-600">{getContent('regular_price', '฿1090')}</span>
                        </div>
                        {!isEarlyBird && (
                          <p className="text-sm text-orange-600 mt-2">Early bird pricing has expired</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Info */}
              <Card className="mt-8 bg-white border border-gray-200 shadow-md">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-4 text-black">Brought to you by:</h4>
                  <div 
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600"
                    dangerouslySetInnerHTML={{ 
                      __html: getContent('brought_to_you_by', 
                        '• BeFitBalance with Jess • C.P.S Coffee • Makkha Health & Spa BKK • Sunshine Market'
                      ).split('•').filter(item => item.trim()).map(item => `<span>• ${item.trim()}</span>`).join('')
                    }}
                  />
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Payment Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="bg-white shadow-xl border border-gray-200">
            <CardContent className="p-8 md:p-12">
              <h3 className="text-3xl font-bold text-center mb-8 text-black" data-testid="text-payment-title">
                Payment Information
              </h3>
              
              <div className="max-w-md mx-auto">
                <div className="bg-black rounded-2xl p-6 text-center shadow-lg">
                  <h4 className="text-xl font-semibold mb-4" style={{ color: 'white' }}>Scan to Pay</h4>
                  
                  {/* SCB Bank */}
                  <div className="bg-gray-800 rounded-lg p-4 mb-4" data-testid="payment-scb-logo">
                    <div className="text-center text-white font-bold text-lg">SCB</div>
                  </div>
                  
                  {/* Thai QR Payment */}
                  <div className="bg-white rounded-lg p-6 mb-4" data-testid="payment-thai-qr">
                    <div className="text-center">
                      <div className="text-black font-bold mb-2">THAI QR</div>
                      <div className="text-black font-semibold">PAYMENT</div>
                    </div>
                  </div>
                  
                  {/* QR Code */}
                  <div className="bg-white rounded-lg p-6 mb-6" data-testid="payment-qr-code">
                    <img 
                      src={getContent('payment_image', qrCodeImage).startsWith('/objects/') 
                        ? getContent('payment_image', qrCodeImage) 
                        : qrCodeImage} 
                      alt="QR Code for Payment" 
                      className="w-80 h-80 mx-auto rounded-lg object-contain" 
                    />
                  </div>
                  
                  <div style={{ color: 'white', fontSize: '14px' }} className="mb-2">PAY TO PROMPTPAY</div>
                  <div style={{ color: 'white', fontSize: '18px', fontWeight: '600' }} className="mb-4" data-testid="text-promptpay-id">5-6791-0000x-xx-x</div>
                  <div style={{ color: 'white', fontSize: '14px' }}>AMOUNT</div>
                  <div style={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }} data-testid="text-payment-amount">
                    {isEarlyBird ? getContent('early_bird_price', '890').replace('฿', '') + '.00' : getContent('regular_price', '1090').replace('฿', '') + '.00'}
                  </div>
                </div>
                
                <div className="mt-6 text-center text-sm text-gray-600">
                  <p>Please complete payment and upload your receipt in the booking form below</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Booking Form */}
      <section id="booking" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardContent className="p-8 md:p-12">
              <h3 className="text-3xl font-bold text-center mb-8 text-black" data-testid="text-booking-title">
                Book Your Spot
              </h3>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700">
                          Full Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Your full name"
                            className={`px-4 py-3 border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 ${
                              form.formState.errors.fullName ? 'border-red-500 focus:ring-red-500' : ''
                            }`}
                            data-testid="input-full-name"
                          />
                        </FormControl>
                        <FormMessage className="text-red-600 text-sm mt-1" />
                      </FormItem>
                    )}
                  />

                  {/* Telephone */}
                  <FormField
                    control={form.control}
                    name="telephone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700">
                          Telephone <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="tel"
                            placeholder="090-001-6646"
                            className={`px-4 py-3 border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 ${
                              form.formState.errors.telephone ? 'border-red-500 focus:ring-red-500' : ''
                            }`}
                            data-testid="input-telephone"
                          />
                        </FormControl>
                        <FormMessage className="text-red-600 text-sm mt-1" />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700">
                          Email <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email"
                            placeholder="your.email@example.com"
                            className={`px-4 py-3 border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 ${
                              form.formState.errors.email ? 'border-red-500 focus:ring-red-500' : ''
                            }`}
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage className="text-red-600 text-sm mt-1" />
                      </FormItem>
                    )}
                  />

                  {/* Early Bird Checkbox */}
                  <FormField
                    control={form.control}
                    name="earlyBirdConfirmed"
                    render={({ field }) => (
                      <FormItem>
                        <Card className="bg-gray-50 border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="mt-1"
                                  data-testid="checkbox-early-bird"
                                />
                              </FormControl>
                              <FormLabel className="text-sm text-gray-700 leading-relaxed">
                                <strong>The Early Bird fee is due before 30 August 2025</strong>
                                <span className="text-red-500"> *</span>
                              </FormLabel>
                            </div>
                            <FormMessage className="mt-2" />
                          </CardContent>
                        </Card>
                      </FormItem>
                    )}
                  />

                  {/* File Upload */}
                  <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="p-4">
                      <FormLabel className="block text-sm font-semibold text-gray-700 mb-3">
                        Please attach your online receipt to confirm our booking <span className="text-red-500">*</span>
                      </FormLabel>
                      <p className="text-sm text-gray-600 mb-3">Upload 1 supported file. Max 100 MB.</p>
                      
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={104857600} // 100MB
                        onGetUploadParameters={handleGetUploadParameters}
                        onComplete={handleUploadComplete}
                      >
                        <Upload className="mr-2" size={16} />
                        Add file
                      </ObjectUploader>
                      
                      {uploadedFileUrl && (
                        <div className="mt-4" data-testid="file-preview">
                          <Card className="bg-white border-gray-200">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center">
                                  <Check className="text-green-500 mr-3" size={16} />
                                  <span className="text-sm text-gray-700">Receipt uploaded successfully</span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setUploadedFileUrl("");
                                    form.setValue("receiptPath", "");
                                  }}
                                  className="text-gray-500 hover:text-gray-700 h-auto p-1 text-xl font-bold"
                                  data-testid="button-remove-file"
                                >
                                  ×
                                </Button>
                              </div>
                              <div className="mt-3">
                                <div className="relative w-full min-h-[200px] max-h-64 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                  <img 
                                    src={uploadedFileUrl} 
                                    alt="Payment Receipt" 
                                    className="w-full h-full object-contain"
                                    data-testid="receipt-preview-image"
                                    onError={(e) => {
                                      console.error('Image failed to load:', uploadedFileUrl);
                                      // Show fallback message instead of hiding
                                      e.currentTarget.style.display = 'none';
                                      const fallback = e.currentTarget.parentElement?.querySelector('.fallback-message') as HTMLElement;
                                      if (fallback) fallback.style.display = 'flex';
                                    }}
                                    onLoad={(e) => {
                                      console.log('Image loaded successfully:', uploadedFileUrl);
                                      // Hide fallback message if image loads
                                      const fallback = (e.target as HTMLElement).parentElement?.querySelector('.fallback-message') as HTMLElement;
                                      if (fallback) fallback.style.display = 'none';
                                    }}
                                  />
                                  <div className="fallback-message absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-100" style={{ display: 'none' }}>
                                    <div className="text-center">
                                      <div>✅ Receipt uploaded successfully</div>
                                      <div className="text-sm mt-2">Preview temporarily unavailable</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Cancellation Policy */}
                  <FormField
                    control={form.control}
                    name="cancellationPolicyAccepted"
                    render={({ field }) => (
                      <FormItem>
                        <Card className="bg-red-50 border-red-200">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    if (checked && !hasPolicyBeenRead) {
                                      // Open modal first if trying to check but haven't read policy
                                      setIsPolicyModalOpen(true);
                                      return;
                                    }
                                    // Allow unchecking or checking if policy has been read
                                    field.onChange(checked);
                                  }}
                                  className="mt-1"
                                  data-testid="checkbox-cancellation-policy"
                                />
                              </FormControl>
                              <div className="flex-1">
                                <FormLabel className="text-sm font-semibold text-gray-700">
                                  Cancellation Policy Agreement <span className="text-red-500">*</span>
                                </FormLabel>
                                <p className="text-xs text-gray-600 mt-1">
                                  I have read and agree to the{" "}
                                  <button
                                    type="button"
                                    onClick={() => setIsPolicyModalOpen(true)}
                                    className="text-black hover:text-gray-700 underline font-medium bg-transparent border-0 p-0 cursor-pointer"
                                    data-testid="button-open-policy-modal"
                                  >
                                    no-refund cancellation policy
                                  </button>
                                  {" "}and understand that all payments are final and non-refundable.
                                  {hasPolicyBeenRead && (
                                    <span className="ml-2 text-green-600 font-medium">✓ Read</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <FormMessage className="mt-2" />
                          </CardContent>
                        </Card>
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <div className="text-center">
                    <button 
                      type="submit" 
                      disabled={createBookingMutation.isPending || !form.watch("cancellationPolicyAccepted")}
                      className="px-12 py-4 rounded-full font-semibold text-lg transform hover:scale-105 transition-all duration-200 shadow-lg disabled:transform-none disabled:opacity-50 border-0 cursor-pointer"
                      data-testid="button-submit-booking"
                      style={{ 
                        color: 'white',
                        backgroundColor: form.watch("cancellationPolicyAccepted") ? '#000000' : '#9ca3af',
                        fontSize: '18px',
                        fontWeight: '600'
                      }}
                    >
                      {createBookingMutation.isPending ? "Submitting..." : "Submit Booking"}
                    </button>
                    {!form.watch("cancellationPolicyAccepted") && (
                      <p className="text-sm text-gray-500 mt-2">
                        Please agree to the cancellation policy to submit your booking
                      </p>
                    )}
                  </div>

                  {/* Disclaimer */}
                  <div className="text-center mt-6">
                    <p className="text-xs text-gray-500">
                      Never submit passwords through this form.
                    </p>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Brand */}
            <div className="text-center md:text-left">
              <h4 className="text-2xl font-bold mb-4 text-black" data-testid="text-footer-brand">Tonelab</h4>
              <p className="text-gray-600">
                Pilates for a stronger, healthier you.
              </p>
            </div>

            {/* Contact Info */}
            <div className="text-center md:text-left">
              <h5 className="text-lg font-semibold mb-4 text-black">Contact</h5>
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center justify-center md:justify-start">
                  <Phone className="mr-3 text-gray-500" size={16} />
                  <a 
                    href="tel:090-001-6646" 
                    className="hover:text-black transition-colors"
                    data-testid="link-phone"
                  >
                    090-001-6646 (Coach Gade)
                  </a>
                </div>
                <div className="flex items-center justify-center md:justify-start">
                  <EnvelopeSimple className="mr-3 text-gray-500" size={16} />
                  <a 
                    href={`mailto:${getContent('contact_email', 'collective.tonelab@gmail.com')}`} 
                    className="hover:text-black transition-colors"
                    data-testid="link-email"
                  >
                    {getContent('contact_email', 'collective.tonelab@gmail.com')}
                  </a>
                </div>
                <div className="flex items-center justify-center md:justify-start">
                  <InstagramLogo className="mr-3 text-gray-500" size={16} />
                  <a 
                    href="https://instagram.com/tonelab.club" 
                    className="hover:text-black transition-colors"
                    data-testid="link-instagram"
                  >
                    @tonelab.club
                  </a>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="text-center md:text-left">
              <h5 className="text-lg font-semibold mb-4 text-black">Location</h5>
              <div className="text-gray-600 mb-4">
                <p className="font-medium" data-testid="text-venue">{getContent('venue_name', 'Asoke Sports Club')}</p>
                <p className="text-sm mt-1" data-testid="text-venue-address">
                  <span dangerouslySetInnerHTML={{ __html: getContent('venue_address', '48 Soi Sukhumvit 16, Khlong Toei,<br />Bangkok 10110, Thailand') }} />
                </p>
              </div>
              <a 
                href={getContent('google_maps_url', 'https://maps.app.goo.gl/5Tru3vjNYC87xc1g7?g_st=ipc')} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-full transition-colors duration-200"
                data-testid="link-google-maps"
              >
                <MapPin className="inline mr-2" size={16} />
                View on Google Maps
                <ArrowSquareOut className="inline ml-2" size={14} />
              </a>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; 2025 Tonelab. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Cancellation Policy Modal */}
      <CancellationPolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => {
          setIsPolicyModalOpen(false);
          // If policy has been read, automatically check the checkbox
          if (hasPolicyBeenRead) {
            // Use setTimeout to ensure state is properly updated
            setTimeout(() => {
              form.setValue("cancellationPolicyAccepted", true);
              form.clearErrors("cancellationPolicyAccepted");
            }, 100);
          }
        }}
        onReadComplete={() => setHasPolicyBeenRead(true)}
      />

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          data-testid="modal-success"
          onClick={() => setIsSuccessModalOpen(false)}
        >
          <Card 
            className="w-full max-w-lg mx-4 shadow-2xl border-0 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-10 text-center">
              <div className="text-green-500 mb-6">
                <Check className="mx-auto" size={80} strokeWidth={2} />
              </div>
              <h3 className="text-3xl font-bold mb-4 text-gray-900" data-testid="text-success-title">
                Booking Submitted!
              </h3>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed" data-testid="text-success-message">
                Your booking has been submitted successfully. We'll contact you soon via email or phone to confirm your registration.
              </p>
              <button 
                onClick={() => setIsSuccessModalOpen(false)}
                className="px-10 py-4 rounded-lg font-semibold transition-all duration-200 border-0 cursor-pointer hover:bg-gray-800 focus:ring-4 focus:ring-gray-300"
                data-testid="button-close-success"
                style={{
                  backgroundColor: '#000000',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600'
                }}
              >
                Close
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
