import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Diamond, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";

export default function Signup() {
  const [currentStep, setCurrentStep] = useState("account");
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    businessName: '',
    phone: '',
    street: '',
    city: '',
    country: '',
    zipCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateStep = (step) => {
    switch (step) {
      case 'account':
        if (!formData.email || !formData.password || !formData.confirmPassword) {
          setError('Please fill in all required fields');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          return false;
        }
        break;
      case 'business':
        if (!formData.fullName || !formData.businessName) {
          setError('Please fill in all required fields');
          return false;
        }
        break;
      default:
        return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setError('');
      if (currentStep === 'account') {
        setCurrentStep('business');
      } else if (currentStep === 'business') {
        setCurrentStep('address');
      }
    }
  };

  const handleBack = () => {
    setError('');
    if (currentStep === 'business') {
      setCurrentStep('account');
    } else if (currentStep === 'address') {
      setCurrentStep('business');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep('business')) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          businessName: formData.businessName,
          phone: formData.phone,
          address: {
            street: formData.street,
            city: formData.city,
            country: formData.country,
            zipCode: formData.zipCode
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Store token in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success('Account created successfully!');
      
      // Redirect to dashboard
      navigate('/dashboard');

    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isAccountStepValid = formData.email && formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 6;
  const isBusinessStepValid = formData.fullName && formData.businessName;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-sky-100 rounded-full">
              <Diamond className="h-8 w-8 text-sky-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Join Diamond Zone</CardTitle>
          <CardDescription>
            Create your merchant account to start trading diamonds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentStep} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="account" disabled={loading}>
                <div className="flex items-center gap-2">
                  {isAccountStepValid && currentStep !== 'account' && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  Account
                </div>
              </TabsTrigger>
              <TabsTrigger value="business" disabled={loading || currentStep === 'account'}>
                <div className="flex items-center gap-2">
                  {isBusinessStepValid && currentStep === 'address' && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  Business
                </div>
              </TabsTrigger>
              <TabsTrigger value="address" disabled={loading || currentStep !== 'address'}>
                Address
              </TabsTrigger>
            </TabsList>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="account" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password (min. 6 characters)"
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button 
                onClick={handleNext}
                className="w-full bg-sky-500 hover:bg-sky-600"
                disabled={loading || !isAccountStepValid}
              >
                Next: Business Info
              </Button>
            </TabsContent>

            <TabsContent value="business" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Enter your business name"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={handleBack}
                  className="flex-1"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleNext}
                  className="flex-1 bg-sky-500 hover:bg-sky-600"
                  disabled={loading || !isBusinessStepValid}
                >
                  Next: Address
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  name="street"
                  type="text"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder="Enter street address"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    type="text"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="Enter ZIP code"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  type="text"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Enter country"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={handleBack}
                  className="flex-1"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit}
                  className="flex-1 bg-sky-500 hover:bg-sky-600"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-sky-600 hover:text-sky-700 font-medium"
            >
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}