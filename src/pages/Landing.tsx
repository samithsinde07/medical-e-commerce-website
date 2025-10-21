import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Shield, Clock, CheckCircle, Pill, Package, Stethoscope } from "lucide-react";
import heroImage from "@/assets/hero-medical.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-20 md:pt-24 pb-12 md:pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--hero-gradient)] opacity-5" />
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-4 md:space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Your Trusted
                <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Medical Supply
                </span>
                Partner
              </h1>
              <p className="text-base md:text-lg lg:text-xl text-muted-foreground">
                Connect with verified pharmacies. Order prescription medicines safely. 
                Get doorstep delivery with real-time tracking.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <Link to="/auth?mode=signup" className="w-full sm:w-auto">
                  <Button size="lg" variant="hero" className="w-full sm:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link to="/products" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Browse Products
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative mt-8 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-2xl md:rounded-3xl blur-3xl" />
              <img
                src={heroImage}
                alt="Medical supplies and pharmacy"
                className="relative rounded-2xl md:rounded-3xl shadow-[var(--elevated-shadow)] w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16 lg:py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-8 md:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">Why Choose MediCare?</h2>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              We provide a secure, efficient platform connecting patients with licensed pharmacies
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:shadow-[var(--glow-shadow)] transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Verified & Secure</h3>
                  <p className="text-muted-foreground">
                    All pharmacies are licensed and verified. Your prescriptions are handled with complete confidentiality.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-[var(--glow-shadow)] transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 rounded-full bg-secondary/10">
                    <Clock className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="text-xl font-semibold">Fast Delivery</h3>
                  <p className="text-muted-foreground">
                    Get your medicines delivered quickly with real-time order tracking from pharmacy to your doorstep.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-[var(--glow-shadow)] transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 rounded-full bg-accent/10">
                    <CheckCircle className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold">Easy Process</h3>
                  <p className="text-muted-foreground">
                    Simple prescription upload, quick approval from pharmacists, and seamless checkout experience.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 md:py-16 lg:py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8 md:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">How It Works</h2>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground">Simple steps to get your medicines</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Pill className="h-10 w-10 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                  1
                </div>
              </div>
              <h3 className="text-xl font-semibold">Upload Prescription</h3>
              <p className="text-muted-foreground">
                Upload your doctor's prescription securely through our platform
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Stethoscope className="h-10 w-10 text-secondary" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold">
                  2
                </div>
              </div>
              <h3 className="text-xl font-semibold">Pharmacist Verification</h3>
              <p className="text-muted-foreground">
                Licensed pharmacists review and approve your prescription
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
                  <Package className="h-10 w-10 text-accent" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold">
                  3
                </div>
              </div>
              <h3 className="text-xl font-semibold">Receive Your Order</h3>
              <p className="text-muted-foreground">
                Track your order and receive medicines at your doorstep
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 lg:py-20 px-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6">Ready to Get Started?</h2>
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto px-4">
            Join thousands of users who trust MediCare for their medical supply needs
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" variant="hero" className="w-full sm:w-auto">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 MediCare. All rights reserved. Your health, our priority.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
