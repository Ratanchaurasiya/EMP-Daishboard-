import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { AssetCondition, EmployeeStatus, AssetType, AssetStatus, ProblemCategory, ServiceStatus, CORPORATE_DEPARTMENTS } from '../../types';
import {
  X,
  User,
  Laptop,
  Headphones,
  Check,
  AlertCircle,
  Sparkles,
  Upload,
  Wrench,
} from 'lucide-react';
import { EmployeeAvatar, CORPORATE_AVATAR_PRESETS } from '../common/EmployeeAvatar';
import { DualDateInput } from '../common/DualDateInput';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose }) => {
  const { addEmployee, showToast } = useApp();

  // Scroll lock and Escape listener
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  const [activeStep, setActiveStep] = useState<'employee' | 'computer' | 'assets'>('employee');

  // Step 1: Employee Details
  const [employeeId, setEmployeeId] = useState('');
  const [companyEmployeeNumber, setCompanyEmployeeNumber] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [designation, setDesignation] = useState('');
  const [team, setTeam] = useState('');
  const [joiningDate, setJoiningDate] = useState('2026-09-01');
  const [status, setStatus] = useState<EmployeeStatus>('Active');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [remarks, setRemarks] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Step 2: Computer Details (Optional provisioning)
  const [includeComputer, setIncludeComputer] = useState(true);
  const [deviceName, setDeviceName] = useState('');
  const [compManufacturer, setCompManufacturer] = useState('Dell');
  const [compModel, setCompModel] = useState('Latitude 5430');
  const [compAssetNumber, setCompAssetNumber] = useState('');
  const [compSerialNumber, setCompSerialNumber] = useState('');
  const [deviceType, setDeviceType] = useState<'Laptop' | 'Desktop'>('Laptop');
  
  // Processor specs
  const [processorName, setProcessorName] = useState('12th Gen Intel(R) Core(TM) i5-1245U');
  const processorGen = '12th Gen';
  const [processorSpeed, setProcessorSpeed] = useState('1.60 GHz (Turbo 4.40 GHz)');

  // Memory specs
  const [installedRAM, setInstalledRAM] = useState('16.00 GB');
  const [usableRAM, setUsableRAM] = useState('15.75 GB');

  // Graphics specs
  const graphicsCard = 'Intel(R) Iris(R) Xe Graphics';
  const graphicsMemory = '512 MB';

  // Storage specs
  const [storageTotal, setStorageTotal] = useState('512 GB');
  const storageUsed = '45 GB';
  const storageFree = '467 GB';
  const [storageType, setStorageType] = useState('NVMe SSD');

  // System specs
  const os = 'Windows 11 Pro 64-bit';
  const systemType = '64-bit operating system, x64-based processor';
  const processorArchitecture = 'x64';
  const [deviceId, setDeviceId] = useState('4C819024-BE99-4389-A210-918237491099');
  const [productId, setProductId] = useState('00330-80000-00012-AAOEM');
  const penAndTouch = 'No pen or touch input is available for this display';
  const compCondition: AssetCondition = 'New';

  // Step 3: Company Assets (Mouse, Keyboard, Headset) - Opt-in provisioning
  const [includeMouse, setIncludeMouse] = useState(false);
  const [mouseAssetNumber, setMouseAssetNumber] = useState('');
  const [mouseSerial, setMouseSerial] = useState('');
  const mouseBrand = 'Logitech';
  const [mouseModel, setMouseModel] = useState('M90 Optical');
  const [mouseCondition, setMouseCondition] = useState<AssetCondition>('New');

  const [includeKeyboard, setIncludeKeyboard] = useState(false);
  const [keyboardAssetNumber, setKeyboardAssetNumber] = useState('');
  const [keyboardSerial, setKeyboardSerial] = useState('');
  const keyboardBrand = 'Dell';
  const [keyboardModel, setKeyboardModel] = useState('KB216 Multimedia');
  const [keyboardCondition, setKeyboardCondition] = useState<AssetCondition>('New');

  const [includeHeadset, setIncludeHeadset] = useState(false);
  const [headsetAssetNumber, setHeadsetAssetNumber] = useState('');
  const [headsetSerial, setHeadsetSerial] = useState('');
  const headsetBrand = 'Jabra';
  const [headsetModel, setHeadsetModel] = useState('Evolve 20 Stereo');
  const [headsetCondition, setHeadsetCondition] = useState<AssetCondition>('New');

  // Step 3: Assigned Company Phone
  const [includePhone, setIncludePhone] = useState(false);
  const [phoneDeviceName, setPhoneDeviceName] = useState('Samsung Galaxy S23');
  const [phoneBrand, setPhoneBrand] = useState('Samsung');
  const [phoneModel, setPhoneModel] = useState('Galaxy S23 5G');
  const [phoneAssetNumber, setPhoneAssetNumber] = useState('');
  const [phoneImei, setPhoneImei] = useState('');
  const [phoneMobileNumber, setPhoneMobileNumber] = useState('');
  const [phoneAssignedDate, setPhoneAssignedDate] = useState(new Date().toISOString().split('T')[0]);
  const [phoneStatus, setPhoneStatus] = useState<AssetStatus>('Assigned');
  const [phoneCondition, setPhoneCondition] = useState<AssetCondition>('New');

  // Step 3: Optional Initial Service / Maintenance Record
  const [includeServiceRecord, setIncludeServiceRecord] = useState(false);
  const [serviceCategory, setServiceCategory] = useState<ProblemCategory>('Software Installation');
  const [serviceProblem, setServiceProblem] = useState('Initial Hardware & OS Provisioning Inspection');
  const [serviceWorkPerformed, setServiceWorkPerformed] = useState('Configured Windows 11 Pro, deployed enterprise security software, passed hardware diagnostics.');
  const [serviceTechnician, setServiceTechnician] = useState('IT Admin');
  const [serviceCost, setServiceCost] = useState<number>(0);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>('Completed');
  const [serviceRemarks, setServiceRemarks] = useState('Initial onboarding deployment inspection');

  if (!isOpen) return null;

  // Auto-generate sample values helper
  const handleAutoFill = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setEmployeeId(`EMP${randomSuffix}`);
    setCompanyEmployeeNumber(`CORP-${randomSuffix + 4000}`);
    setName('Arjun Mehta');
    setDepartment('Engineering');
    setDesignation('Software Development Engineer');
    setTeam('Platform Core');
    setPhone('+91 98112 34567');
    setEmail('arjun.mehta@company.com');
    setRemarks('Standard developer package issued.');
    setPhotoUrl('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=face');

    setCompAssetNumber(`LAP-${randomSuffix}`);
    setDeviceName(`Arjun_Latitude_${randomSuffix}`);
    setCompSerialNumber(`CN-0H99-${randomSuffix}-DEL`);

    setMouseAssetNumber(`MOU-${randomSuffix}`);
    setMouseSerial(`2409LZ${randomSuffix}9`);

    setKeyboardAssetNumber(`KEY-${randomSuffix}`);
    setKeyboardSerial(`CN-KB${randomSuffix}-DEL`);

    setHeadsetAssetNumber(`HED-${randomSuffix}`);
    setHeadsetSerial(`JB-EV${randomSuffix}-USB`);

    setIncludePhone(true);
    setPhoneAssetNumber(`PHN-${randomSuffix}`);
    setPhoneDeviceName('Samsung Galaxy S23');
    setPhoneBrand('Samsung');
    setPhoneModel('Galaxy S23 (128GB)');
    setPhoneImei(`358921098234${randomSuffix}`);
    setPhoneMobileNumber(`+91 98765 00${randomSuffix}`);
    setPhoneAssignedDate(joiningDate);
    setPhoneStatus('Assigned');
    setPhoneCondition('New');

    setIncludeServiceRecord(true);
    setServiceCategory('Software Installation');
    setServiceProblem('Initial Hardware & OS Provisioning Inspection');
    setServiceWorkPerformed('Installed corporate software stack, configured endpoint security, verified hardware benchmarks.');
    setServiceTechnician('IT Admin');
    setServiceCost(0);
    setServiceStatus('Completed');
    setServiceRemarks('Pre-deployment verification completed.');

    showToast('Sample enterprise values auto-filled!', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId.trim() || !name.trim() || !email.trim()) {
      showToast('Please fill out Employee ID, Name, and Email.', 'error');
      setActiveStep('employee');
      return;
    }

    // Build computer data if requested
    const computerTag = compAssetNumber.trim() || (deviceType === 'Desktop' ? `DSK-${employeeId.trim()}` : `LAP-${employeeId.trim()}`);
    const computerData = includeComputer ? {
      assetNumber: computerTag,
      deviceName: deviceName.trim() || `${name.replace(/\s+/g, '_')}_PC`,
      manufacturer: compManufacturer,
      model: compModel,
      deviceType,
      serialNumber: compSerialNumber.trim() || `SN-${computerTag}`,
      processor: {
        name: processorName,
        generation: processorGen,
        speed: processorSpeed,
      },
      memory: {
        installedRAM,
        usableRAM,
      },
      graphics: {
        card: graphicsCard,
        memory: graphicsMemory,
      },
      storage: {
        total: storageTotal,
        used: storageUsed,
        free: storageFree,
        type: storageType,
      },
      system: {
        os,
        systemType,
        processorArchitecture,
        deviceId,
        productId,
        penAndTouch,
      },
      condition: compCondition,
      status: 'Assigned' as const,
      assignedDate: joiningDate,
      remarks: 'Allocated on joining',
    } : null;

    // Build peripheral assets
    const assetsData: Array<{
      assetType: AssetType;
      assetNumber: string;
      brand: string;
      model: string;
      serialNumber: string;
      assignedDate: string;
      condition: AssetCondition;
      status?: AssetStatus;
      deviceName?: string;
      imeiNumber?: string;
      phoneNumber?: string;
      remarks?: string;
    }> = [];

    if (includeMouse) {
      const tag = mouseAssetNumber.trim() || `MOU-${employeeId.trim()}`;
      assetsData.push({
        assetType: 'Mouse',
        assetNumber: tag,
        brand: mouseBrand,
        model: mouseModel,
        serialNumber: mouseSerial.trim() || `SN-${tag}`,
        assignedDate: joiningDate,
        condition: mouseCondition,
        remarks: 'Provisioned with desktop kit',
      });
    }

    if (includeKeyboard) {
      const tag = keyboardAssetNumber.trim() || `KEY-${employeeId.trim()}`;
      assetsData.push({
        assetType: 'Keyboard',
        assetNumber: tag,
        brand: keyboardBrand,
        model: keyboardModel,
        serialNumber: keyboardSerial.trim() || `SN-${tag}`,
        assignedDate: joiningDate,
        condition: keyboardCondition,
        remarks: 'Provisioned with desktop kit',
      });
    }

    if (includeHeadset) {
      const tag = headsetAssetNumber.trim() || `HED-${employeeId.trim()}`;
      assetsData.push({
        assetType: 'Headset',
        assetNumber: tag,
        brand: headsetBrand,
        model: headsetModel,
        serialNumber: headsetSerial.trim() || `SN-${tag}`,
        assignedDate: joiningDate,
        condition: headsetCondition,
        remarks: 'Provisioned for VoIP and video calls',
      });
    }

    if (includePhone) {
      const generatedPhoneTag = phoneAssetNumber.trim() || `PHN-${employeeId.trim()}`;
      const resolvedImei = phoneImei.trim() || `3589201${Date.now().toString().slice(-8)}`;
      assetsData.push({
        assetType: 'Mobile Phone',
        assetNumber: generatedPhoneTag,
        brand: phoneBrand.trim() || 'Samsung',
        model: phoneModel.trim() || 'Galaxy S23',
        serialNumber: resolvedImei,
        assignedDate: phoneAssignedDate || joiningDate,
        condition: phoneCondition,
        status: phoneStatus,
        deviceName: phoneDeviceName.trim() || `${phoneBrand} ${phoneModel}`.trim(),
        imeiNumber: resolvedImei,
        phoneNumber: phoneMobileNumber.trim() || phone.trim() || '+91 98000 00000',
        remarks: `Company Phone: ${phoneMobileNumber.trim() || phone.trim() || 'N/A'} (IMEI: ${resolvedImei})`,
      });
    }

    const serviceRecordData = includeServiceRecord ? {
      problemCategory: serviceCategory,
      problem: serviceProblem.trim() || 'Initial Hardware & OS Provisioning Inspection',
      workPerformed: serviceWorkPerformed.trim() || 'Standard OS installation and verification',
      partsReplaced: 'None',
      technician: serviceTechnician.trim() || 'IT Admin',
      serviceCost: Number(serviceCost) || 0,
      serviceStatus,
      resolution: 'System provisioned and verified for active deployment.',
      remarks: serviceRemarks.trim() || 'Onboarding inspection record',
    } : null;

    const res = addEmployee(
      {
        employeeId: employeeId.trim(),
        companyEmployeeNumber: companyEmployeeNumber.trim() || `CORP-${employeeId.trim()}`,
        name: name.trim(),
        department,
        designation: designation.trim() || 'Software Engineer',
        team: team.trim() || 'Engineering',
        joiningDate,
        status,
        email: email.trim(),
        phone: phone.trim() || '+91 98000 00000',
        remarks: remarks.trim(),
        photoUrl: photoUrl.trim() || undefined,
      },
      computerData,
      assetsData,
      serviceRecordData
    );

    if (res.success) {
      onClose();
    }
  };

  const handleSaveEmployeeOnly = () => {
    if (!name.trim()) {
      showToast('Employee name is required', 'error');
      return;
    }
    if (!employeeId.trim()) {
      showToast('Employee ID is required', 'error');
      return;
    }

    const res = addEmployee(
      {
        employeeId: employeeId.trim(),
        companyEmployeeNumber: companyEmployeeNumber.trim() || `CORP-${employeeId.trim()}`,
        name: name.trim(),
        department,
        designation: designation.trim() || 'Software Engineer',
        team: team.trim() || 'Engineering',
        joiningDate,
        status,
        email: email.trim(),
        phone: phone.trim() || '+91 98000 00000',
        remarks: remarks.trim(),
        photoUrl: photoUrl.trim() || undefined,
      },
      null,
      null,
      null
    );

    if (res.success) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-[#101726] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-[#1e293b] animate-fade-in my-auto overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-[#1e293b] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                Onboard Employee & Provision Assets
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Register employee, Windows specs, and equipment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAutoFill}
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
              title="Fill with valid sample data for quick testing"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Auto-Fill</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Navigation Tabs (Touch scrollable on mobile) */}
        <div className="flex border-b border-slate-100 dark:border-[#1e293b] px-3 sm:px-4 pt-1 bg-slate-50/50 dark:bg-[#0d131f] text-xs overflow-x-auto scrollbar-none touch-pan-x flex-nowrap">
          <button
            type="button"
            onClick={() => setActiveStep('employee')}
            className={`flex items-center gap-2 py-2 px-3 font-semibold border-b-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeStep === 'employee'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep('computer')}
            className={`flex items-center gap-2 py-2 px-3 font-semibold border-b-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeStep === 'computer'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>2. Computer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep('assets')}
            className={`flex items-center gap-2 py-2 px-3 font-semibold border-b-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeStep === 'assets'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>3. Assets & Phone</span>
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          onKeyDown={e => {
            if (e.key === 'Enter' && activeStep !== 'assets' && (e.target as HTMLElement).tagName.toLowerCase() !== 'textarea') {
              e.preventDefault();
              if (activeStep === 'employee') setActiveStep('computer');
              else if (activeStep === 'computer') setActiveStep('assets');
            }
          }}
          className="flex-1 overflow-y-auto p-5 space-y-3.5"
        >
          {/* STEP 1: EMPLOYEE DETAILS (NO LOCATION) */}
          {activeStep === 'employee' && (
            <div className="space-y-3.5 text-xs animate-fade-in">
              {/* Employee Photo Upload Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] flex flex-col sm:flex-row sm:items-center gap-4">
                <EmployeeAvatar
                  name={name || 'New Employee'}
                  photoUrl={photoUrl}
                  size="xl"
                  editable={true}
                  onPhotoChange={url => setPhotoUrl(url)}
                  onPhotoRemove={() => setPhotoUrl('')}
                />
                <div className="flex-1 space-y-2">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Employee Profile Photo
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Upload a photo from your computer or click a corporate preset below
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Image</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2.5 * 1024 * 1024) {
                            showToast('Photo size must be under 2.5MB', 'error');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (reader.result) setPhotoUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="hidden"
                      />
                    </label>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1">
                      {CORPORATE_AVATAR_PRESETS.slice(0, 5).map(preset => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setPhotoUrl(preset.url)}
                          className="w-7 h-7 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:scale-110 hover:border-blue-500 transition-all cursor-pointer"
                          title={preset.label}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-full h-full object-cover object-top"
                          />
                        </button>
                      ))}
                    </div>

                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="text-[11px] text-rose-600 hover:text-rose-500 font-semibold px-2 py-1 cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMP009"
                    value={employeeId}
                    onChange={e => setEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Company Employee Number / Badge
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CORP-8830"
                    value={companyEmployeeNumber}
                    onChange={e => setCompanyEmployeeNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-medium focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Department *
                  </label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                  >
                    {CORPORATE_DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Frontend Engineer"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Team
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Core Architecture"
                    value={team}
                    onChange={e => setTeam(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Company Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Company Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <DualDateInput
                    label="Joining Date"
                    value={joiningDate}
                    onChange={setJoiningDate}
                    required={true}
                    helperText="Type DD-MM-YYYY or pick from calendar"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Employee Status
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as EmployeeStatus)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                  >
                    <option value="Active">Active</option>
                    <option value="On Probation">On Probation</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Contractual">Contractual</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Resigned">Resigned</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Remarks / Allocation Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional IT provisioning notes..."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#1e293b] gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSaveEmployeeOnly}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold rounded-lg border border-emerald-300/60 dark:border-emerald-800/60 transition-colors cursor-pointer text-xs"
                  title="Save employee profile now without provisioning hardware"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Save Employee Profile Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStep('computer')}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer text-xs ml-auto"
                >
                  <span>Provision Hardware & Assets →</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: COMPUTER SPECIFICATIONS (Windows About) */}
          {activeStep === 'computer' && (
            <div className="space-y-3.5 text-xs animate-fade-in">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#1e293b]">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Provision Laptop or Desktop Computer?
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Assign a primary computer with complete Windows System Information
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={includeComputer}
                  onChange={e => setIncludeComputer(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 dark:bg-[#090d16]"
                />
              </div>

              {includeComputer && (
                <div className="space-y-3.5">
                  {/* Basic Device Identifiers */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Computer Asset Number *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. LAP-010"
                        value={compAssetNumber}
                        onChange={e => setCompAssetNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-blue-600 dark:text-blue-400 rounded-lg text-xs font-mono font-bold focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Device Name (Windows hostname)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul_Latitude"
                        value={deviceName}
                        onChange={e => setDeviceName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Serial Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CN-0H7482-DEL"
                        value={compSerialNumber}
                        onChange={e => setCompSerialNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Manufacturer
                      </label>
                      <input
                        type="text"
                        value={compManufacturer}
                        onChange={e => setCompManufacturer(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Model
                      </label>
                      <input
                        type="text"
                        value={compModel}
                        onChange={e => setCompModel(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Device Type
                      </label>
                      <select
                        value={deviceType}
                        onChange={e => setDeviceType(e.target.value as 'Laptop' | 'Desktop')}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                      >
                        <option value="Laptop">Laptop</option>
                        <option value="Desktop">Desktop</option>
                      </select>
                    </div>
                  </div>

                  {/* Processor */}
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#1e293b] space-y-2">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Processor Information
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Processor Name</label>
                        <input
                          type="text"
                          value={processorName}
                          onChange={e => setProcessorName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md font-mono text-xs focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Speed / Clock</label>
                        <input
                          type="text"
                          value={processorSpeed}
                          onChange={e => setProcessorSpeed(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md font-mono text-xs focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* RAM & Storage */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#1e293b] space-y-2">
                      <span className="font-bold text-slate-900 dark:text-white block">Memory (RAM)</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Installed RAM</label>
                          <input
                            type="text"
                            value={installedRAM}
                            onChange={e => setInstalledRAM(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md font-mono text-xs focus:outline-hidden focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Usable RAM</label>
                          <input
                            type="text"
                            value={usableRAM}
                            onChange={e => setUsableRAM(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md font-mono text-xs focus:outline-hidden focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#1e293b] space-y-2">
                      <span className="font-bold text-slate-900 dark:text-white block">Storage</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Total Storage</label>
                          <input
                            type="text"
                            value={storageTotal}
                            onChange={e => setStorageTotal(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md font-mono text-xs focus:outline-hidden focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Storage Type</label>
                          <input
                            type="text"
                            value={storageType}
                            onChange={e => setStorageType(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md font-mono text-xs focus:outline-hidden focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Device ID & Product ID */}
                  <div className="p-3.5 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Windows Device Security Identifiers (IT Admin Restricted)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Device ID</label>
                        <input
                          type="text"
                          value={deviceId}
                          onChange={e => setDeviceId(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md font-mono text-xs focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Product ID</label>
                        <input
                          type="text"
                          value={productId}
                          onChange={e => setProductId(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md font-mono text-xs focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep('employee')}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#101726] dark:hover:bg-slate-800 border border-slate-200 dark:border-[#1e293b] text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
                >
                  ← Back to Employee
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep('assets')}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-xs transition-colors"
                >
                  <span>Continue to Peripherals →</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: COMPANY ASSETS (Mouse, Keyboard, Headset) */}
          {activeStep === 'assets' && (
            <div className="space-y-3.5 text-xs animate-fade-in">
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Select company peripherals to bundle into this employee's initial setup.
              </p>

              {/* Mouse */}
              <div className="p-3.5 rounded-lg bg-slate-50/50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#1e293b] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <span>🖱️</span>
                    <span>Company Mouse</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeMouse}
                    onChange={e => setIncludeMouse(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 dark:bg-[#090d16]"
                  />
                </div>

                {includeMouse && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Asset Number</label>
                      <input
                        type="text"
                        placeholder="e.g. MOU-035"
                        value={mouseAssetNumber}
                        onChange={e => setMouseAssetNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md font-mono text-xs focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Brand & Model</label>
                      <input
                        type="text"
                        value={mouseModel}
                        onChange={e => setMouseModel(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md text-xs focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Condition</label>
                      <select
                        value={mouseCondition}
                        onChange={e => setMouseCondition(e.target.value as AssetCondition)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md text-xs focus:outline-hidden focus:border-blue-500"
                      >
                        <option value="New">New</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Keyboard */}
              <div className="p-3.5 rounded-lg bg-slate-50/50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#1e293b] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <span>⌨️</span>
                    <span>Company Keyboard</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeKeyboard}
                    onChange={e => setIncludeKeyboard(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 dark:bg-[#090d16]"
                  />
                </div>

                {includeKeyboard && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Asset Number</label>
                      <input
                        type="text"
                        placeholder="e.g. KEY-030"
                        value={keyboardAssetNumber}
                        onChange={e => setKeyboardAssetNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md font-mono text-xs focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Brand & Model</label>
                      <input
                        type="text"
                        value={keyboardModel}
                        onChange={e => setKeyboardModel(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md text-xs focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Condition</label>
                      <select
                        value={keyboardCondition}
                        onChange={e => setKeyboardCondition(e.target.value as AssetCondition)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md text-xs focus:outline-hidden focus:border-blue-500"
                      >
                        <option value="New">New</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Headset */}
              <div className="p-3.5 rounded-lg bg-slate-50/50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#1e293b] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <span>🎧</span>
                    <span>Company Headset</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeHeadset}
                    onChange={e => setIncludeHeadset(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 dark:bg-[#090d16]"
                  />
                </div>

                {includeHeadset && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Asset Number</label>
                      <input
                        type="text"
                        placeholder="e.g. HED-025"
                        value={headsetAssetNumber}
                        onChange={e => setHeadsetAssetNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md font-mono text-xs focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Brand & Model</label>
                      <input
                        type="text"
                        value={headsetModel}
                        onChange={e => setHeadsetModel(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md text-xs focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Condition</label>
                      <select
                        value={headsetCondition}
                        onChange={e => setHeadsetCondition(e.target.value as AssetCondition)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md text-xs focus:outline-hidden focus:border-blue-500"
                      >
                        <option value="New">New</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Assigned Company Phone */}
              <div className="p-3.5 rounded-lg bg-slate-50/50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#1e293b] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <span>📱</span>
                    <span>Assigned Company Phone</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Assign Phone</span>
                    <input
                      type="checkbox"
                      checked={includePhone}
                      onChange={e => setIncludePhone(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 dark:bg-[#090d16]"
                    />
                  </label>
                </div>

                {includePhone && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Device Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Samsung Galaxy S23"
                          value={phoneDeviceName}
                          onChange={e => setPhoneDeviceName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md text-xs focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Brand *</label>
                        <input
                          type="text"
                          placeholder="e.g. Samsung, Apple, Google"
                          value={phoneBrand}
                          onChange={e => setPhoneBrand(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md text-xs focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Model *</label>
                        <input
                          type="text"
                          placeholder="e.g. Galaxy S23 5G / iPhone 15"
                          value={phoneModel}
                          onChange={e => setPhoneModel(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md text-xs focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">IMEI Number *</label>
                        <input
                          type="text"
                          placeholder="15-digit IMEI (e.g. 358921098234561)"
                          value={phoneImei}
                          onChange={e => setPhoneImei(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md font-mono text-xs focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Mobile Number *</label>
                        <input
                          type="text"
                          placeholder="e.g. +91 98765 43210"
                          value={phoneMobileNumber}
                          onChange={e => setPhoneMobileNumber(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md font-mono text-xs focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Asset Tag / ID</label>
                        <input
                          type="text"
                          placeholder="e.g. PHN-001"
                          value={phoneAssetNumber}
                          onChange={e => setPhoneAssetNumber(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md font-mono text-xs focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Assignment Date</label>
                        <input
                          type="date"
                          value={phoneAssignedDate}
                          onChange={e => setPhoneAssignedDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md text-xs focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Status</label>
                        <select
                          value={phoneStatus}
                          onChange={e => setPhoneStatus(e.target.value as AssetStatus)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md text-xs focus:outline-hidden focus:border-blue-500"
                        >
                          <option value="Assigned">Assigned</option>
                          <option value="Available">Available</option>
                          <option value="In Repair">In Repair</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Condition</label>
                        <select
                          value={phoneCondition}
                          onChange={e => setPhoneCondition(e.target.value as AssetCondition)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md text-xs focus:outline-hidden focus:border-blue-500"
                        >
                          <option value="New">New</option>
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Initial Service / Maintenance Record */}
              <div className="p-3 bg-slate-50/70 dark:bg-[#101726]/60 border border-slate-200/80 dark:border-[#1e293b] rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Wrench className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Initial Service & Maintenance Record (Optional)
                      </span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Log initial hardware diagnostic, provisioning inspection, or setup verification
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeServiceRecord}
                      onChange={e => setIncludeServiceRecord(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {includeServiceRecord && (
                  <div className="space-y-3 pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Category *</label>
                        <select
                          value={serviceCategory}
                          onChange={e => setServiceCategory(e.target.value as ProblemCategory)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md text-xs focus:outline-hidden focus:border-blue-500"
                        >
                          <option value="Software Installation">Software Installation</option>
                          <option value="Windows Problem">Windows Configuration</option>
                          <option value="Hardware Failure">Hardware Inspection</option>
                          <option value="Formatting">Formatting & OS Image</option>
                          <option value="Other">Other Maintenance</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Title / Problem *</label>
                        <input
                          type="text"
                          placeholder="e.g. Initial OS Provisioning & Quality Inspection"
                          value={serviceProblem}
                          onChange={e => setServiceProblem(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md text-xs focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Technician / Inspector</label>
                        <input
                          type="text"
                          placeholder="e.g. IT Admin"
                          value={serviceTechnician}
                          onChange={e => setServiceTechnician(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md text-xs focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Work Performed *</label>
                        <input
                          type="text"
                          placeholder="e.g. Standard OS image deployed, diagnostic checks passed."
                          value={serviceWorkPerformed}
                          onChange={e => setServiceWorkPerformed(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md text-xs focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Service Status</label>
                        <select
                          value={serviceStatus}
                          onChange={e => setServiceStatus(e.target.value as ServiceStatus)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md text-xs focus:outline-hidden focus:border-blue-500"
                        >
                          <option value="Completed">Completed</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Pending Parts">Pending Parts</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setActiveStep('computer')}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#101726] dark:hover:bg-slate-800 border border-slate-200 dark:border-[#1e293b] text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
                >
                  ← Back to Computer
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-xs transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Finalize & Register Employee</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
