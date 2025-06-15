import Image from "next/image";
import Script from "next/script";
import Navbar from "../components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";

export default function LandingPage() {
  return (
    <>
      <Navbar />

      <header className="masthead bg-primary text-white text-center">
        <div className="container d-flex align-items-center flex-column">
          <Image
            className="masthead-avatar mb-5"
            src="/assets/img/avataaars.svg"
            alt="Avatar"
            width={200}
            height={200}
          />
          <h1 className="masthead-heading text-uppercase mb-0">
            Your AI-Powered Writing Companion
          </h1>
          <div className="divider-custom divider-light">
            <div className="divider-custom-line"></div>
            <div className="divider-custom-icon">
              <i className="fas fa-star"></i>
            </div>
            <div className="divider-custom-line"></div>
          </div>
          <p className="masthead-subheading font-weight-light mb-0">
            Write smarter - Collaborate seamlessly - Create effortlessly
          </p>
        </div>

        <div className="text-center mt-4">
          <SignedIn>
            <Link href="/dashboard">
              <button className="btn btn-light btn-xl">Go to Dashboard</button>
            </Link>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn btn-light btn-xl">Sign In to Get Started</button>
            </SignInButton>
          </SignedOut>
        </div>
      </header>
      
      {/* Rest of your content remains the same */}
      <section className="page-section bg-light mb-0" id="about">
        <div className="container">
          <h2 className="page-section-heading text-center text-uppercase text-black">
            Why Editext?
          </h2>
          <div className="divider-custom divider-dark">
            <div className="divider-custom-line"></div>
            <div className="divider-custom-icon">
              <i className="fas fa-star"></i>
            </div>
            <div className="divider-custom-line"></div>
          </div>
          <p className="text-center ">
            Editext revolutionizes document creation with real-time
            collaboration and intelligent writing assistance.
          </p>
          <section className="points pt-4">
            <div className="container px-lg-5">
              <div className="row gx-lg-5">
                <div className="col-lg-6 col-xxl-4 mb-5">
                  <div className="card bg-light border-0 h-100">
                    <div className="card-body text-center p-4 p-lg-5 pt-0 pt-lg-0">
                      <div className="feature bg-primary bg-gradient text-white rounded-3 mb-4 mt-n4">
                        <i className="bi bi-people-fill"></i>
                      </div>
                      <h2 className="fs-4 fw-bold">Instant Co-Editing</h2>
                      <p className="mb-0">
                        Real-time collaborative editing with multiple users.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 col-xxl-4 mb-5">
                  <div className="card bg-light border-0 h-100">
                    <div className="card-body text-center p-4 p-lg-5 pt-0 pt-lg-0">
                      <div className="feature bg-primary bg-gradient text-white rounded-3 mb-4 mt-n4">
                        <i className="bi bi-clock-history"></i>
                      </div>
                      <h2 className="fs-4 fw-bold">Version History</h2>
                      <p className="mb-0">
                        Track changes and restore previous document versions.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 col-xxl-4 mb-5">
                  <div className="card bg-light border-0 h-100">
                    <div className="card-body text-center p-4 p-lg-5 pt-0 pt-lg-0">
                      <div className="feature bg-primary bg-gradient text-white rounded-3 mb-4 mt-n4">
                        <i className="bi bi-exclamation-circle-fill"></i>
                      </div>
                      <h2 className="fs-4 fw-bold">Detect Grammar Issues</h2>
                      <p className="mb-0">
                        Real-time grammar and spelling error detection.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 col-xxl-4 mb-5">
                  <div className="card bg-light border-0 h-100">
                    <div className="card-body text-center p-4 p-lg-5 pt-0 pt-lg-0">
                      <div className="feature bg-primary bg-gradient text-white rounded-3 mb-4 mt-n4">
                        <i className="bi bi-magic"></i>
                      </div>
                      <h2 className="fs-4 fw-bold">Generate Content Ideas</h2>
                      <p className="mb-0">
                        AI-powered content suggestions to spark creativity.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 col-xxl-4 mb-5">
                  <div className="card bg-light border-0 h-100">
                    <div className="card-body text-center p-4 p-lg-5 pt-0 pt-lg-0">
                      <div className="feature bg-primary bg-gradient text-white rounded-3 mb-4 mt-n4">
                        <i className="bi bi-key-fill"></i>
                      </div>
                      <h2 className="fs-4 fw-bold">Secure Environment</h2>
                      <p className="mb-0">
                        Enterprise-grade security with encryption and access
                        controls.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 col-xxl-4 mb-5">
                  <div className="card bg-light border-0 h-100">
                    <div className="card-body text-center p-4 p-lg-5 pt-0 pt-lg-0">
                      <div className="feature bg-primary bg-gradient text-white rounded-3 mb-4 mt-n4">
                        <i className="bi bi-patch-check-fill"></i>
                      </div>
                      <h2 className="fs-4 fw-bold">Improve Writing Quality</h2>
                      <p className="mb-0">
                        Enhance style and clarity with smart suggestions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      <Footer />

      <Script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"
        strategy="afterInteractive"
      />
      <Script src="/js/scripts.js" strategy="afterInteractive" />
    </>
  );
}