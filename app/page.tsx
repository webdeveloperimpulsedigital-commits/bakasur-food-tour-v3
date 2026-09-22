'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BakasurVideoPlayer } from '@/components/BakasurVideoPlayer';
import { BakasurEatingStage } from '@/components/BakasurEatingStage';
import { Frame1Welcome } from '@/components/frames/Frame1Welcome';
import { Frame2RestaurantSearch } from '@/components/frames/Frame2RestaurantSearch';
import { Frame3DishSelection } from '@/components/frames/Frame3DishSelection';
import { Frame4ManualDish } from '@/components/frames/Frame4ManualDish';
import { Frame5EatingBegins } from '@/components/frames/Frame5EatingBegins';
import { Frame6FeedingLoop } from '@/components/frames/Frame6FeedingLoop';
import { Frame6RandomFoodSpot } from '@/components/frames/Frame6RandomFoodSpot';
import { FoodTourSpot, getRandomFoodSpot } from '@/lib/foodTourSpots';
import { Frame7AcidityAppears } from '@/components/frames/Frame7AcidityAppears';
import { Frame8HelpBakasur } from '@/components/frames/Frame8HelpBakasur';
import { Frame9GastriumAnimation } from '@/components/frames/Frame9GastriumAnimation';
import { Frame10Submitted } from '@/components/frames/Frame10Submitted';
import { Frame11LiveMap } from '@/components/frames/Frame11LiveMap';
import { Frame12Registration } from '@/components/frames/Frame12Registration';
import { Frame13Confirmation } from '@/components/frames/Frame13Confirmation';
import { Restaurant, Dish } from '@/lib/db';
import { getOrCreateSessionId, resetSessionId, trackUserStep } from '@/lib/tracker';

export type FrameNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export default function CampaignPage() {
  // Campaign State
  const [currentFrame, setCurrentFrame] = useState<FrameNumber>(1);
  const [sessionId, setSessionId] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('Pune');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedDish, setSelectedDish] = useState<Dish | { name: string; id?: number; price?: number; image?: string; description?: string } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [feastingStage, setFeastingStage] = useState<1 | 2 | 3>(1);
  const [registeredMobile, setRegisteredMobile] = useState<string>('');
  const [participationId, setParticipationId] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [regError, setRegError] = useState<string>('');
  const [tourSpotRound, setTourSpotRound] = useState<number>(0); // 0 = trailer, 1 = spot 1, 2 = spot 2
  const [currentTourSpot, setCurrentTourSpot] = useState<FoodTourSpot | null>(null);
  const [visitedSpotIds, setVisitedSpotIds] = useState<string[]>([]);

  // Audio FX generator
  const playSound = useCallback((type: 'click' | 'bite' | 'fanfare' | 'relief') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      if (type === 'click' || type === 'bite') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(type === 'click' ? 440 : 220, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'relief') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'fanfare') {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.08 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.3);
        });
      }
    } catch {
      // Ignore
    }
  }, [soundEnabled]);

  // Initialize Session on Mount
  useEffect(() => {
    const sess = getOrCreateSessionId();
    setSessionId(sess);

    trackUserStep({
      sessionId: sess,
      stepName: 'frame_1_welcome',
      stepTitle: 'Frame 1: Welcome Screen Opened',
      stepNumber: 1,
      userLocation: selectedCity
    });
  }, [selectedCity]);

  // Real-time GPS detection on app mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoords({ lat, lng });
          try {
            const res = await fetch(`/api/location?lat=${lat}&lng=${lng}`);
            const data = await res.json();
            if (data.success && data.detectedCity?.name) {
              setSelectedCity(data.detectedCity.name);
            }
          } catch {
            // Ignore
          }
        },
        () => {},
        { timeout: 5000, enableHighAccuracy: true }
      );
    }
  }, []);

  // Frame 1 -> Frame 2 (Welcome -> Restaurant Search)
  const handleStartTour = () => {
    playSound('click');
    setCurrentFrame(2);
    trackUserStep({
      sessionId,
      stepName: 'frame_2_restaurant_search',
      stepTitle: 'Frame 2: Restaurant Search Screen Opened',
      stepNumber: 2,
      userLocation: selectedCity
    });
  };

  // Frame 2 -> Frame 3 (Restaurant Chosen -> 3 Dish Options)
  const handleRestaurantConfirmed = () => {
    playSound('click');
    setCurrentFrame(3);
    trackUserStep({
      sessionId,
      stepName: 'frame_3_dish_selection',
      stepTitle: `Frame 3: Dish Options Opened for ${selectedRestaurant?.name || 'Restaurant'}`,
      stepNumber: 3,
      restaurantId: selectedRestaurant?.id,
      metadata: { restaurant_name: selectedRestaurant?.name }
    });
  };

  // Frame 3 -> Frame 4 (Manual Dish Entry clicked)
  const handleGoToManualDish = () => {
    playSound('click');
    setCurrentFrame(4);
    trackUserStep({
      sessionId,
      stepName: 'frame_4_manual_dish',
      stepTitle: `Frame 4: Manual Dish Entry Opened for ${selectedRestaurant?.name || 'Restaurant'}`,
      stepNumber: 4,
      restaurantId: selectedRestaurant?.id
    });
  };

  // Frame 3 / 4 -> Frame 5 (Dish Chosen -> Eating Begins)
  const handleDishConfirmed = async (customDishName?: string) => {
    playSound('bite');
    const finalDish = customDishName
      ? { name: customDishName, id: Math.floor(Math.random() * 80000) + 10000, price: 150 }
      : selectedDish || { name: 'Signature Food', id: 1, price: 150 };

    setSelectedDish(finalDish);
    setFeastingStage(1);
    setCurrentFrame(5);

    trackUserStep({
      sessionId,
      stepName: 'frame_5_eating_begins',
      stepTitle: `Frame 5: Bakasur Mode ON - Eating ${finalDish.name}`,
      stepNumber: 5,
      restaurantId: selectedRestaurant?.id,
      dishId: (finalDish as { id?: number })?.id,
      foodMeterPercentage: 20,
      metadata: {
        dish_name: finalDish.name,
        restaurant_name: selectedRestaurant?.name
      }
    });

    // Register campaign session start
    try {
      await fetch('/api/campaign/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_location: selectedCity,
          restaurant_id: selectedRestaurant?.id || 1,
          dish_id: (finalDish as { id?: number })?.id || 1
        })
      });
    } catch {}
  };

  // Frame 5 -> Frame 6 (Eating Begins -> Feeding Loop)
  const handleFeedMore = () => {
    playSound('click');
    if (feastingStage === 1) {
      setFeastingStage(2);
      setCurrentFrame(6);
    } else if (feastingStage === 2) {
      setFeastingStage(3);
      setCurrentFrame(6);
    } else {
      handleFeedingLoopComplete();
      return;
    }

    trackUserStep({
      sessionId,
      stepName: 'frame_6_feeding_loop',
      stepTitle: `Frame 6: Feeding Loop Progressed (Round ${feastingStage + 1})`,
      stepNumber: 6,
      restaurantId: selectedRestaurant?.id,
      foodMeterPercentage: feastingStage === 1 ? 60 : 90
    });
  };

  // Frame 6 (Trailer) -> Random Food Tour Spot 1
  const handleStartFoodTour = () => {
    playSound('bite');
    const firstSpot = getRandomFoodSpot([]);
    setCurrentTourSpot(firstSpot);
    setVisitedSpotIds([firstSpot.id]);
    setTourSpotRound(1);
    setFeastingStage(2);

    trackUserStep({
      sessionId,
      stepName: `frame_6_tour_spot_1_${firstSpot.id}`,
      stepTitle: `Frame 6: Random Tour Spot 1 - ${firstSpot.dishName} at ${firstSpot.spotName}`,
      stepNumber: 6,
      foodMeterPercentage: 65,
      metadata: {
        dish_name: firstSpot.dishName,
        spot_name: firstSpot.spotName,
        round: 1
      }
    });
  };

  // Random Food Tour Spot (Eating twice - 2 dishes before acidity kicks in)
  const handleNextTourSpot = () => {
    if (tourSpotRound === 1) {
      playSound('bite');
      const secondSpot = getRandomFoodSpot(visitedSpotIds);
      setCurrentTourSpot(secondSpot);
      setVisitedSpotIds((prev) => [...prev, secondSpot.id]);
      setTourSpotRound(2);
      setFeastingStage(3);

      trackUserStep({
        sessionId,
        stepName: `frame_6_tour_spot_2_${secondSpot.id}`,
        stepTitle: `Frame 6: Random Tour Spot 2 - ${secondSpot.dishName} at ${secondSpot.spotName}`,
        stepNumber: 6,
        foodMeterPercentage: 90,
        metadata: {
          dish_name: secondSpot.dishName,
          spot_name: secondSpot.spotName,
          round: 2
        }
      });
      return;
    }

    // After Round 2 finishes: Overeating Acidity kicks in!
    playSound('relief');
    setTourSpotRound(0);
    setCurrentTourSpot(null);
    setFeastingStage(3);
    setCurrentFrame(7);

    trackUserStep({
      sessionId,
      stepName: 'frame_7_acidity_appears',
      stepTitle: 'Frame 7: Bakasur Overeats 2 Food Tour Spots - Acidity Appears',
      stepNumber: 7,
      restaurantId: selectedRestaurant?.id,
      foodMeterPercentage: 100
    });
  };

  // Frame 6 -> Frame 7 (Feeding Loop Complete -> Acidity Appears)
  const handleFeedingLoopComplete = () => {
    playSound('bite');
    setFeastingStage(3);
    setCurrentFrame(7);

    trackUserStep({
      sessionId,
      stepName: 'frame_7_acidity_appears',
      stepTitle: 'Frame 7: Acidity Appears (Overeating After Round 3)',
      stepNumber: 7,
      restaurantId: selectedRestaurant?.id,
      foodMeterPercentage: 100
    });
  };

  // Frame 7 -> Frame 8 (Comic Reaction Complete -> Help Bakasur)
  const handleAcidityAutoAdvance = () => {
    setCurrentFrame(8);
    trackUserStep({
      sessionId,
      stepName: 'frame_8_help_bakasur',
      stepTitle: 'Frame 8: Bakasur Needs Help Prompt',
      stepNumber: 8,
      restaurantId: selectedRestaurant?.id
    });
  };

  // Frame 8 -> Frame 9 (Help Bakasur Clicked -> Gastrium Dose Animation)
  const handleHelpBakasur = () => {
    playSound('relief');
    setCurrentFrame(9);
    trackUserStep({
      sessionId,
      stepName: 'frame_9_gastrium_animation',
      stepTitle: 'Frame 9: Gastrium 4-Message Automatic Relief Sequence Started',
      stepNumber: 9,
      restaurantId: selectedRestaurant?.id
    });
  };

  // Frame 9 -> Frame 10 (Gastrium Animation Finished -> Recommendation Submitted)
  const handleGastriumComplete = () => {
    playSound('fanfare');
    setCurrentFrame(10);
    trackUserStep({
      sessionId,
      stepName: 'frame_10_recommendation_submitted',
      stepTitle: 'Frame 10: Recommendation Submitted (Mazaa Aa Gaya)',
      stepNumber: 10,
      restaurantId: selectedRestaurant?.id,
      dishId: (selectedDish as { id?: number })?.id,
      metadata: {
        restaurant_name: selectedRestaurant?.name,
        dish_name: selectedDish?.name
      }
    });
  };

  // Frame 10 -> Frame 11 (Recommendation Submitted -> Live Food Tour Map)
  const handleViewMap = async () => {
    playSound('click');

    // Automatically persist visited spot to MySQL DB
    try {
      await fetch('/api/campaign/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          restaurant_id: selectedRestaurant?.id || 1,
          restaurant_name: selectedRestaurant?.name || 'Local Restaurant',
          dish_id: (selectedDish as { id?: number })?.id || null,
          dish_name: selectedDish?.name || 'Signature Food',
          city: selectedRestaurant?.city || selectedCity || 'Pune',
          latitude: selectedRestaurant?.latitude || userCoords?.lat || 18.5204,
          longitude: selectedRestaurant?.longitude || userCoords?.lng || 73.8407
        })
      });
    } catch (err) {
      console.warn('Failed to record visit to DB:', err);
    }

    setCurrentFrame(11);
    trackUserStep({
      sessionId,
      stepName: 'frame_11_live_map',
      stepTitle: 'Frame 11: Live Food Tour Map Explored',
      stepNumber: 11,
      restaurantId: selectedRestaurant?.id
    });
  };

  // Frame 11 -> Frame 2 (Ek Aur Food Stop Jodo)
  const handleAddAnotherSpot = () => {
    playSound('click');
    setSelectedRestaurant(null);
    setSelectedDish(null);
    setFeastingStage(1);
    setTourSpotRound(0);
    setCurrentTourSpot(null);
    setCurrentFrame(2);
    trackUserStep({
      sessionId,
      stepName: 'frame_11_add_another_spot',
      stepTitle: 'Frame 11: Ek Aur Food Stop Jodo Clicked',
      stepNumber: 11
    });
  };

  // Frame 11 -> Frame 12 (Live Map -> Registration Form)
  const handleRegisterLiveTour = () => {
    playSound('click');
    setCurrentFrame(12);
    trackUserStep({
      sessionId,
      stepName: 'frame_12_registration',
      stepTitle: 'Frame 12: Live Food Tour Registration Form Opened',
      stepNumber: 12
    });
  };

  // Frame 12 -> Frame 13 (Registration Submit -> Confirmation)
  const handleRegistrationSubmit = async (mobile: string, name?: string, concern?: string) => {
    setIsRegistering(true);
    setRegError('');
    try {
      const res = await fetch('/api/campaign/participate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          mobile,
          name: name || 'Foodie Follower',
          city: selectedRestaurant?.city || selectedCity,
          restaurant_id: selectedRestaurant?.id || 1,
          restaurant_name: selectedRestaurant?.name || 'Local Food Spot',
          dish_id: (selectedDish as { id?: number })?.id || 1,
          dish_name: selectedDish?.name || 'Signature Food',
          latitude: selectedRestaurant?.latitude || 18.5204,
          longitude: selectedRestaurant?.longitude || 73.8407,
          consent: true,
          terms_accepted: true,
          user_concern: concern
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        playSound('fanfare');
        setRegisteredMobile(mobile);
        setParticipationId(json.data.participation_id || 'BKT-' + Math.floor(100000 + Math.random() * 900000));
        setCurrentFrame(13);

        trackUserStep({
          sessionId,
          stepName: 'frame_13_confirmation',
          stepTitle: `Frame 13: Tour Pass Confirmed (${json.data.participation_id})`,
          stepNumber: 13,
          metadata: { mobile, participation_id: json.data.participation_id, user_concern: concern }
        });
        return true;
      } else {
        setRegError(json.error || 'Registration failed. Please try again.');
        return false;
      }
    } catch {
      setRegError('Server error. Please try again.');
      return false;
    } finally {
      setIsRegistering(false);
    }
  };

  // Restart Food Tour (Back to Frame 1 / Frame 2 with a clean session)
  const handleRestart = () => {
    playSound('click');
    const newSess = resetSessionId();
    setSessionId(newSess);
    setSelectedRestaurant(null);
    setSelectedDish(null);
    setFeastingStage(1);
    setTourSpotRound(0);
    setCurrentTourSpot(null);
    setVisitedSpotIds([]);
    setCurrentFrame(1);

    trackUserStep({
      sessionId: newSess,
      stepName: 'frame_1_welcome',
      stepTitle: 'Food Tour Restarted - Fresh Session Initiated',
      stepNumber: 1
    });
  };

  return (
    <div className="h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full flex items-center justify-center bg-[#050b1e] overflow-hidden select-none p-0 md:p-6 lg:p-8">
      {/* Responsive Canvas: Mobile portrait stack (< md), Desktop split screen (md:flex-row, Left: Video, Right: Content) */}
      {/* If Frame 5: FULL SCREEN EATING STAGE (auto-transitions after 10s) */}
      {currentFrame === 5 ? (
        <div className="w-full h-full md:max-w-5xl lg:max-w-6xl md:h-[90vh] md:max-h-[860px] bg-[#04115b] md:rounded-[2.5rem] md:shadow-[0_25px_80px_rgba(0,0,0,0.9)] md:border-[4px] md:border-slate-800/80 overflow-hidden relative">
          <BakasurEatingStage
            dishName={selectedDish?.name || 'Signature Food'}
            dishImage={selectedDish?.image}
            restaurantName={selectedRestaurant?.name}
            restaurant={selectedRestaurant}
            feastingStage={feastingStage}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
            onBack={() => setCurrentFrame(3)}
            onComplete={() => setCurrentFrame(6)}
            onPlayBite={() => playSound('bite')}
          />
        </div>
      ) : currentFrame === 6 && tourSpotRound > 0 && currentTourSpot ? (
        <div className="w-full h-full md:max-w-5xl lg:max-w-6xl md:h-[90vh] md:max-h-[860px] bg-white md:rounded-[2.5rem] md:shadow-[0_25px_80px_rgba(0,0,0,0.9)] md:border-[4px] md:border-slate-800/80 overflow-hidden relative">
          <Frame6RandomFoodSpot
            spot={currentTourSpot}
            round={tourSpotRound}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
            onBack={() => setTourSpotRound(0)}
            onFeedMore={handleNextTourSpot}
          />
        </div>
      ) : currentFrame === 11 ? (
        /* Standalone Map Frame matching user_mockup_map.png */
        /* Desktop: Horizontal side-by-side (md:max-w-5xl lg:max-w-6xl), Mobile: Exact phone card (max-w-[440px]) */
        <div className="w-full h-full max-w-[440px] md:max-w-5xl lg:max-w-6xl md:h-[90vh] md:max-h-[860px] bg-white md:rounded-[2.5rem] md:shadow-[0_25px_80px_rgba(0,0,0,0.9)] md:border-[4px] md:border-slate-800/80 overflow-hidden relative flex flex-col">
          <Frame11LiveMap
            sessionId={sessionId}
            currentUserSpot={selectedRestaurant ? {
              name: selectedRestaurant.name,
              city: selectedRestaurant.city,
              dishName: selectedDish?.name || 'Specialty Dish',
              latitude: selectedRestaurant.latitude,
              longitude: selectedRestaurant.longitude
            } : null}
            onRegisterLiveTour={handleRegisterLiveTour}
            onSuggestAnotherSpot={handleAddAnotherSpot}
            onRegisterSubmit={handleRegistrationSubmit}
            isRegistering={isRegistering}
            regError={regError}
          />
        </div>
      ) : currentFrame === 13 ? (
        /* Frame 13: Last Frame (Registration Completed) */
        /* Desktop view is horizontal (md:flex-row), Mobile view is vertical (flex-col) */
        <div className="w-full h-full md:max-w-4xl lg:max-w-5xl md:h-[88vh] md:max-h-[820px] bg-white md:rounded-[2.5rem] md:shadow-[0_25px_80px_rgba(0,0,0,0.9)] md:border-[4px] md:border-slate-800/80 overflow-hidden relative flex flex-col md:flex-row">
          <Frame13Confirmation
            participationId={participationId}
            mobile={registeredMobile}
            restaurant={selectedRestaurant}
            dish={selectedDish}
            onBackToMap={() => setCurrentFrame(11)}
            onRestart={handleRestart}
          />
        </div>
      ) : (
        /* Normal Canvas for Other Frames */
        <div className={`w-full h-full md:max-w-5xl lg:max-w-6xl md:h-[90vh] md:max-h-[860px] ${currentFrame === 1 ? 'bg-[#f4f6fa]' : 'bg-white'} md:rounded-[2.5rem] md:shadow-[0_25px_80px_rgba(0,0,0,0.9)] md:border-[4px] md:border-slate-800/80 overflow-hidden flex flex-col md:flex-row relative`}>
          
          {/* Left Side on Desktop / Top Half on Mobile: Royal Blue Character Stage */}
          <div className={`w-full md:w-1/2 ${currentFrame === 1 ? 'h-[58%]' : currentFrame === 6 ? 'h-[46%] sm:h-[48%]' : 'h-[36%] sm:h-[38%]'} md:h-full relative overflow-hidden bg-[#04115b] shrink-0`}>
            <BakasurVideoPlayer
              videoUrl="/uploads/videos/video-frame-1.mp4"
              stageName={
                currentFrame === 1 ? 'welcome' :
                currentFrame === 2 ? 'restaurant' :
                currentFrame === 3 || currentFrame === 4 ? 'dish' :
                currentFrame === 6 ? 'trailer' :
                currentFrame === 7 ? 'heartburn' :
                currentFrame === 8 ? 'heartburn' :
                currentFrame === 9 ? 'relief' :
                currentFrame === 10 ? 'relief_done' : 'map'
              }
              frameNumber={currentFrame}
              feastingStage={feastingStage}
              dishName={selectedDish?.name || 'Signature Food'}
              dishImage={selectedDish?.image}
              restaurantName={selectedRestaurant?.name}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              onBack={currentFrame === 2 ? () => setCurrentFrame(1) : currentFrame === 3 ? () => setCurrentFrame(2) : undefined}
              stepIndicator={currentFrame === 2 ? '1/3' : currentFrame === 3 ? '2/3' : undefined}
            />
          </div>

          {/* Right Side on Desktop / Bottom Half on Mobile: Content Card */}
          <div className={`w-full md:w-1/2 flex-1 md:h-full flex flex-col overflow-y-auto ${currentFrame === 1 ? 'bg-[#f4f6fa] p-0' : 'bg-white p-2 sm:p-4 md:p-6 lg:p-8'} text-slate-900 relative z-20 justify-start md:justify-center`}>
            <main className="flex-1 w-full flex flex-col justify-start md:justify-center min-h-0 relative">
              {/* Frame 1: Welcome */}
              {currentFrame === 1 && (
                <Frame1Welcome onStart={handleStartTour} cityName={selectedCity} />
              )}

              {/* Frame 2: Restaurant Search */}
              {currentFrame === 2 && (
                <Frame2RestaurantSearch
                  selectedCity={selectedCity}
                  selectedRestaurant={selectedRestaurant}
                  userCoords={userCoords}
                  onSelectRestaurant={(r) => setSelectedRestaurant(r)}
                  onNext={handleRestaurantConfirmed}
                  onBack={() => setCurrentFrame(1)}
                />
              )}

              {/* Frame 3: Dish Selection (3 Options) */}
              {currentFrame === 3 && selectedRestaurant && (
                <Frame3DishSelection
                  restaurant={selectedRestaurant}
                  selectedDish={selectedDish}
                  onSelectDish={(d) => setSelectedDish(d)}
                  onConfirmDish={() => handleDishConfirmed()}
                  onManualEntry={handleGoToManualDish}
                  onBack={() => setCurrentFrame(2)}
                />
              )}

              {/* Frame 4: Manual Dish Entry */}
              {currentFrame === 4 && selectedRestaurant && (
                <Frame4ManualDish
                  restaurant={selectedRestaurant}
                  onCustomDishSubmit={(dishName) => handleDishConfirmed(dishName)}
                  onBackToOptions={() => setCurrentFrame(3)}
                />
              )}

              {/* Frame 6: Food Trailer Frame (Mockup after food eating) */}
              {currentFrame === 6 && (
                <Frame6FeedingLoop
                  restaurant={selectedRestaurant || { id: 1, name: 'Local Restaurant', city: 'Pune' }}
                  dish={selectedDish || { name: 'Signature Food', id: 1 }}
                  onCompleteLoop={handleStartFoodTour}
                />
              )}

            {/* Frame 7: Acidity Appears (Comic reaction playing) */}
            {currentFrame === 7 && (
              <Frame7AcidityAppears onAutoAdvance={handleAcidityAutoAdvance} />
            )}

            {/* Frame 8: Help Bakasur */}
            {currentFrame === 8 && (
              <Frame8HelpBakasur onHelpBakasur={handleHelpBakasur} />
            )}

            {/* Frame 9: Gastrium Animation (4 sequential messages + end line) */}
            {currentFrame === 9 && (
              <Frame9GastriumAnimation onAnimationComplete={handleGastriumComplete} />
            )}

            {/* Frame 10: Shukriya Dost / Map Par Dekho (Matching User Mockup 2) */}
            {currentFrame === 10 && (
              <Frame10Submitted
                restaurant={selectedRestaurant || { id: 1, name: 'Local Restaurant', city: selectedCity || 'Pune' }}
                dish={selectedDish || { name: 'Signature Food' }}
                onViewMap={handleViewMap}
              />
            )}

            {/* Frame 12: Registration (Mobile number & consent) */}
            {currentFrame === 12 && (
              <Frame12Registration
                onSubmitNumber={async (m, n) => { await handleRegistrationSubmit(m, n); }}
                onBack={() => setCurrentFrame(11)}
                isLoading={isRegistering}
                error={regError}
              />
            )}

          </main>
        </div>
      </div>
      )}
    </div>
  );
}
