import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5050;

// Configurable Enterprise CORS supporting Vercel, Render, custom domains, and localhost
const allowedOriginSetting = process.env.CORS_ORIGIN || '*';

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, server-to-server, curl)
      if (!origin) return callback(null, true);
      if (allowedOriginSetting === '*') return callback(null, true);

      const origins = allowedOriginSetting.split(',').map(o => o.trim().toLowerCase());
      const lowerOrigin = origin.toLowerCase();

      if (
        origins.includes(lowerOrigin) ||
        lowerOrigin.endsWith('.vercel.app') ||
        lowerOrigin.endsWith('.onrender.com') ||
        lowerOrigin.includes('localhost') ||
        lowerOrigin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback to permissive to ensure zero custom-domain blocking
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// Support JSON body up to 50MB (for high-res employee photos, camera audits & backup dumps)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health and Telemetry Check (supports both /health and /api/health)
app.get(['/health', '/api/health'], async (req, res) => {
  try {
    const stats = await db.getStats();
    const isDbReady = stats.connected !== false;
    res.status(isDbReady ? 200 : 503).json({
      status: isDbReady ? 'ok' : 'degraded',
      database: isDbReady ? 'connected' : 'disconnected',
      engine: db.activeEngine,
      timestamp: new Date().toISOString(),
      stats: {
        totalRecords: stats.totalRecords || 0,
        counts: stats.counts || {},
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

// Dedicated Production Database Diagnostic Endpoint
app.get('/api/db-status', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json({
      success: true,
      status: 'online',
      engine: db.activeEngine,
      isPostgres: db.isPostgres,
      isSQLite: db.isSQLite,
      dbPath: db.dbPath,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json({
      success: true,
      stats,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Single Rapid Hydration Bootstrap Endpoint
app.get('/api/bootstrap', async (req, res) => {
  try {
    const [
      employees,
      computers,
      assets,
      serviceRecords,
      allocationRecords,
      auditLogs,
      weeklyPhotoRecords,
      purchases,
      assetRequests,
      simCards,
      simRecharges,
      simRequests,
      serviceProviders,
      assetQueries,
      removedEmployees,
      stats,
    ] = await Promise.all([
      db.getAll('employees'),
      db.getAll('computers'),
      db.getAll('assets'),
      db.getAll('service_records'),
      db.getAll('allocations'),
      db.getAll('audit_logs'),
      db.getAll('weekly_photos'),
      db.getAll('purchases'),
      db.getAll('asset_requests'),
      db.getAll('sim_cards'),
      db.getAll('sim_recharges'),
      db.getAll('sim_requests'),
      db.getAll('service_providers'),
      db.getAll('asset_queries'),
      db.getAll('removed_employees'),
      db.getStats(),
    ]);

    res.json({
      success: true,
      databaseConnected: stats.connected !== false,
      engine: db.activeEngine,
      data: {
        employees,
        computers,
        assets,
        serviceRecords,
        allocationRecords,
        auditLogs,
        weeklyPhotoRecords,
        purchases,
        assetRequests,
        simCards,
        simRecharges,
        simRequests,
        serviceProviders,
        assetQueries,
        removedEmployees,
      },
      stats,
    });
  } catch (err) {
    console.error('[API Bootstrap Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to bootstrap database: ' + err.message });
  }
});

// ==================== EMPLOYEES CRUD ====================
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await db.getAll('employees');
    res.json({ success: true, data: employees });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const employee = req.body;
    if (!employee || !employee.id || !employee.employeeId) {
      return res.status(400).json({ success: false, error: 'Employee ID and internal UUID are required' });
    }

    // Check duplicate employee ID
    const existing = await db.getAll('employees');
    const duplicate = existing.find(
      e => e.employeeId && e.employeeId.trim().toLowerCase() === employee.employeeId.trim().toLowerCase() && e.id !== employee.id
    );
    if (duplicate) {
      return res.status(409).json({
        success: false,
        error: `Employee ID "${employee.employeeId}" already exists in the database.`,
      });
    }

    const saved = await db.upsert('employees', employee);
    console.log(`[Database] Employee saved permanently: ${employee.name} (${employee.employeeId}) on ${db.activeEngine}`);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error('[API Employee Post Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getById('employees', id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const updated = { ...existing, ...req.body, id };
    await db.upsert('employees', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const emp = await db.getById('employees', id);
    const success = await db.delete('employees', id);

    if (success) {
      console.log(`[Database] Employee permanently removed by Admin: ${emp?.name || id}`);
      
      const targetIds = [id];
      if (emp?.id) targetIds.push(emp.id);
      if (emp?.employeeId) targetIds.push(emp.employeeId);
      const isTarget = (field) => {
        if (!field) return false;
        const lower = String(field).trim().toLowerCase();
        return targetIds.some(t => String(t).trim().toLowerCase() === lower);
      };

      // 1. Cascade delete SIM cards assigned to this employee
      try {
        const allSims = await db.getAll('sim_cards');
        for (const s of allSims) {
          if (isTarget(s.assignedEmployeeId)) {
            await db.delete('sim_cards', s.id);
          }
        }
      } catch (simErr) {
        console.warn('[Database] Error cascade deleting SIMs:', simErr.message);
      }

      // 2. Cascade delete SIM recharges for this employee
      try {
        const allRecharges = await db.getAll('sim_recharges');
        for (const r of allRecharges) {
          if (isTarget(r.employeeId)) {
            await db.delete('sim_recharges', r.id);
          }
        }
      } catch (recErr) {
        console.warn('[Database] Error cascade deleting SIM recharges:', recErr.message);
      }

      // 3. Cascade delete SIM requests submitted by this employee
      try {
        const allSimReqs = await db.getAll('sim_requests');
        for (const reqItem of allSimReqs) {
          if (isTarget(reqItem.employeeId)) {
            await db.delete('sim_requests', reqItem.id);
          }
        }
      } catch (srErr) {
        console.warn('[Database] Error cascade deleting SIM requests:', srErr.message);
      }

      // 4. Cascade delete computers assigned to this employee
      try {
        const allComps = await db.getAll('computers');
        for (const c of allComps) {
          if (isTarget(c.assignedEmployeeId)) {
            await db.delete('computers', c.id);
          }
        }
      } catch (compErr) {
        console.warn('[Database] Error cascade deleting computers:', compErr.message);
      }

      // 5. Cascade delete peripherals & phones assigned to this employee
      try {
        const allAssets = await db.getAll('assets');
        for (const a of allAssets) {
          if (isTarget(a.assignedEmployeeId)) {
            await db.delete('assets', a.id);
          }
        }
      } catch (assetErr) {
        console.warn('[Database] Error cascade deleting assets:', assetErr.message);
      }

      // 6. Cascade delete allocation records
      try {
        const allAllocations = await db.getAll('allocation_records');
        for (const alloc of allAllocations) {
          if (isTarget(alloc.employeeId)) {
            await db.delete('allocation_records', alloc.id);
          }
        }
      } catch (allocErr) {
        console.warn('[Database] Error cascade deleting allocations:', allocErr.message);
      }

      // 7. Cascade delete service records
      try {
        const allServices = await db.getAll('service_records');
        for (const srv of allServices) {
          if (isTarget(srv.employeeId)) {
            await db.delete('service_records', srv.id);
          }
        }
      } catch (srvErr) {
        console.warn('[Database] Error cascade deleting service records:', srvErr.message);
      }

      // 8. Cascade delete asset requests
      try {
        const allAssetReqs = await db.getAll('asset_requests');
        for (const reqItem of allAssetReqs) {
          if (isTarget(reqItem.employeeId)) {
            await db.delete('asset_requests', reqItem.id);
          }
        }
      } catch (arErr) {
        console.warn('[Database] Error cascade deleting asset requests:', arErr.message);
      }

      // 9. Cascade delete weekly photo records
      try {
        const allPhotos = await db.getAll('weekly_photos');
        for (const p of allPhotos) {
          if (isTarget(p.employeeId)) {
            await db.delete('weekly_photos', p.id);
          }
        }
      } catch (wpErr) {
        console.warn('[Database] Error cascade deleting weekly photos:', wpErr.message);
      }

      res.json({ success: true, message: 'Employee and all associated records (including SIM cards) permanently deleted' });
    } else {
      res.status(404).json({ success: false, error: 'Employee could not be deleted' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/employees', async (req, res) => {
  try {
    await db.clear('employees');
    console.log('[Database] Admin cleared all employees');
    res.json({ success: true, message: 'All employees cleared' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== COMPUTERS CRUD ====================
app.get('/api/computers', async (req, res) => {
  try {
    const computers = await db.getAll('computers');
    res.json({ success: true, data: computers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/computers', async (req, res) => {
  try {
    const comp = req.body;
    if (!comp || !comp.id || !comp.assetNumber) {
      return res.status(400).json({ success: false, error: 'Asset Number and ID are required' });
    }

    const existing = await db.getAll('computers');
    const duplicate = existing.find(
      c => c.assetNumber && c.assetNumber.trim().toLowerCase() === comp.assetNumber.trim().toLowerCase() && c.id !== comp.id
    );
    if (duplicate) {
      return res.status(409).json({
        success: false,
        error: `Computer Asset Number "${comp.assetNumber}" already exists.`,
      });
    }

    const saved = await db.upsert('computers', comp);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/computers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getById('computers', id);
    if (!existing) return res.status(404).json({ success: false, error: 'Computer not found' });

    const updated = { ...existing, ...req.body, id };
    await db.upsert('computers', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/computers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete('computers', id);
    res.json({ success: true, message: 'Computer deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== ASSETS CRUD ====================
app.get('/api/assets', async (req, res) => {
  try {
    const assets = await db.getAll('assets');
    res.json({ success: true, data: assets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/assets', async (req, res) => {
  try {
    const asset = req.body;
    if (!asset || !asset.id || !asset.assetNumber) {
      return res.status(400).json({ success: false, error: 'Asset ID and Asset Number are required' });
    }
    const saved = await db.upsert('assets', asset);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getById('assets', id);
    if (!existing) return res.status(404).json({ success: false, error: 'Asset not found' });

    const updated = { ...existing, ...req.body, id };
    await db.upsert('assets', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/assets/:id', async (req, res) => {
  try {
    await db.delete('assets', req.params.id);
    res.json({ success: true, message: 'Asset deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== ALLOCATIONS CRUD ====================
app.get('/api/allocations', async (req, res) => {
  try {
    const allocations = await db.getAll('allocations');
    res.json({ success: true, data: allocations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/allocations', async (req, res) => {
  try {
    const alloc = req.body;
    const saved = await db.upsert('allocations', alloc);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/allocations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getById('allocations', id);
    if (!existing) return res.status(404).json({ success: false, error: 'Allocation not found' });
    const updated = { ...existing, ...req.body, id };
    await db.upsert('allocations', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/allocations/:id', async (req, res) => {
  try {
    await db.delete('allocations', req.params.id);
    res.json({ success: true, message: 'Allocation deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== SERVICE RECORDS CRUD ====================
app.get('/api/services', async (req, res) => {
  try {
    const records = await db.getAll('service_records');
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    const srv = req.body;
    const saved = await db.upsert('service_records', srv);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getById('service_records', id);
    if (!existing) return res.status(404).json({ success: false, error: 'Service record not found' });
    const updated = { ...existing, ...req.body, id };
    await db.upsert('service_records', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    await db.delete('service_records', req.params.id);
    res.json({ success: true, message: 'Service record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== AUDIT LOGS ====================
app.get('/api/audit', async (req, res) => {
  try {
    const logs = await db.getAll('audit_logs');
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/audit', async (req, res) => {
  try {
    const log = req.body;
    const saved = await db.upsert('audit_logs', log);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== WEEKLY PHOTOS CRUD ====================
app.get('/api/weekly-photos', async (req, res) => {
  try {
    const records = await db.getAll('weekly_photos');
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/weekly-photos', async (req, res) => {
  try {
    const record = req.body;
    const saved = await db.upsert('weekly_photos', record);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/weekly-photos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getById('weekly_photos', id);
    if (!existing) return res.status(404).json({ success: false, error: 'Weekly photo not found' });
    const updated = { ...existing, ...req.body, id };
    await db.upsert('weekly_photos', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/weekly-photos/:id', async (req, res) => {
  try {
    await db.delete('weekly_photos', req.params.id);
    res.json({ success: true, message: 'Weekly photo record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== PURCHASES & ACCESSORIES CRUD ====================
app.get('/api/purchases', async (req, res) => {
  try {
    const purchases = await db.getAll('purchases');
    res.json({ success: true, data: purchases });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/purchases', async (req, res) => {
  try {
    const record = req.body;
    if (!record) {
      return res.status(400).json({ success: false, error: 'Purchase record data is required' });
    }
    if (!record.id) {
      record.id = 'PUR-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    }

    // Ensure serial number uniqueness if provided
    if (record.serialNumber && record.serialNumber.trim()) {
      const existing = await db.getAll('purchases');
      const duplicate = existing.find(
        p => p.serialNumber && p.serialNumber.trim().toLowerCase() === record.serialNumber.trim().toLowerCase() && p.id !== record.id
      );
      if (duplicate) {
        return res.status(409).json({
          success: false,
          error: `Hardware Serial Number "${record.serialNumber}" already registered in purchase database.`,
        });
      }
    }

    // Compute automatic financial totals
    const deviceCost = Number(record.deviceCost) || 0;
    const accessories = Array.isArray(record.accessories) ? record.accessories : [];
    const totalAccessoriesCost = accessories.reduce((sum, item) => {
      const q = Number(item.quantity) || 1;
      const c = Number(item.unitCost) || 0;
      return sum + (q * c);
    }, 0);
    const grandTotalCost = deviceCost + totalAccessoriesCost;

    const normalizedRecord = {
      ...record,
      deviceCost,
      totalAccessoriesCost,
      grandTotalCost,
      accessories: accessories.map(a => ({
        ...a,
        quantity: Number(a.quantity) || 1,
        unitCost: Number(a.unitCost) || 0,
        totalCost: (Number(a.quantity) || 1) * (Number(a.unitCost) || 0),
      })),
      updatedAt: new Date().toISOString(),
      createdAt: record.createdAt || new Date().toISOString(),
    };

    const saved = await db.upsert('purchases', normalizedRecord);
    console.log(`[Database] Purchase registered: ${normalizedRecord.brand} ${normalizedRecord.modelName} (Grand Total: ₹${grandTotalCost})`);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error('[API Purchases Post Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/purchases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getById('purchases', id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Purchase record not found' });
    }

    const updates = req.body;
    const deviceCost = updates.deviceCost !== undefined ? Number(updates.deviceCost) : Number(existing.deviceCost) || 0;
    const accessories = Array.isArray(updates.accessories) ? updates.accessories : (existing.accessories || []);
    const totalAccessoriesCost = accessories.reduce((sum, item) => {
      const q = Number(item.quantity) || 1;
      const c = Number(item.unitCost) || 0;
      return sum + (q * c);
    }, 0);
    const grandTotalCost = deviceCost + totalAccessoriesCost;

    const updated = {
      ...existing,
      ...updates,
      id,
      deviceCost,
      totalAccessoriesCost,
      grandTotalCost,
      accessories: accessories.map(a => ({
        ...a,
        quantity: Number(a.quantity) || 1,
        unitCost: Number(a.unitCost) || 0,
        totalCost: (Number(a.quantity) || 1) * (Number(a.unitCost) || 0),
      })),
      updatedAt: new Date().toISOString(),
    };

    await db.upsert('purchases', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/purchases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.delete('purchases', id);
    if (success) {
      res.json({ success: true, message: 'Purchase record deleted' });
    } else {
      res.status(404).json({ success: false, error: 'Purchase record could not be deleted' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== ASSET REQUESTS (REQUISITIONS) CRUD ====================
app.get('/api/asset-requests', async (req, res) => {
  try {
    const requests = await db.getAll('asset_requests');
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/asset-requests', async (req, res) => {
  try {
    const request = req.body;
    if (!request || !request.id || !request.employeeId) {
      return res.status(400).json({ success: false, error: 'Request ID and employee ID are required' });
    }

    const saved = await db.upsert('asset_requests', {
      ...request,
      createdAt: request.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`[Database] Equipment requisition logged: #${request.id} for ${request.employeeName} (${request.items?.length || 0} categories)`);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error('[API Asset Request Post Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/asset-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getById('asset_requests', id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Asset request not found' });
    }

    const updates = req.body;
    const updated = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };

    await db.upsert('asset_requests', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/asset-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.delete('asset_requests', id);
    if (success) {
      res.json({ success: true, message: 'Asset request deleted' });
    } else {
      res.status(404).json({ success: false, error: 'Asset request could not be deleted' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== SIM CARDS & TELECOM MANAGEMENT CRUD ====================
app.get('/api/sims', async (req, res) => {
  try {
    const sims = await db.getAll('sim_cards');
    res.json({ success: true, data: sims });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/sims/:id', async (req, res) => {
  try {
    const sim = await db.getById('sim_cards', req.params.id);
    if (!sim) {
      return res.status(404).json({ success: false, error: 'SIM card not found' });
    }
    res.json({ success: true, data: sim });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sims', async (req, res) => {
  try {
    const sim = req.body;
    if (!sim.id) sim.id = `SIM-${Date.now()}`;
    const now = new Date().toISOString();
    const saved = await db.upsert('sim_cards', {
      ...sim,
      createdAt: sim.createdAt || now,
      updatedAt: now,
    });
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/sims/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getById('sim_cards', id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'SIM card not found' });
    }
    const updated = {
      ...existing,
      ...req.body,
      id,
      updatedAt: new Date().toISOString(),
    };
    await db.upsert('sim_cards', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sims/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, suspendedBy } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'Mandatory reason is required to suspend a SIM card.' });
    }
    const existing = await db.getById('sim_cards', id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'SIM card not found' });
    }
    const now = new Date().toISOString();
    const updated = {
      ...existing,
      status: 'Suspended',
      suspensionReason: reason.trim(),
      suspendedBy: suspendedBy || 'Admin',
      suspendedAt: now,
      updatedAt: now,
    };
    await db.upsert('sim_cards', updated);
    res.json({ success: true, data: updated, message: 'SIM card successfully suspended.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/sims/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, suspendedBy } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'Mandatory reason is required to suspend a SIM card.' });
    }
    const existing = await db.getById('sim_cards', id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'SIM card not found' });
    }
    const now = new Date().toISOString();
    const updated = {
      ...existing,
      status: 'Suspended',
      suspensionReason: reason.trim(),
      suspendedBy: suspendedBy || 'Admin',
      suspendedAt: now,
      updatedAt: now,
    };
    await db.upsert('sim_cards', updated);
    res.json({ success: true, data: updated, message: 'SIM card successfully suspended.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sims/:id/reactivate', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getById('sim_cards', id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'SIM card not found' });
    }
    const now = new Date().toISOString();
    const updated = {
      ...existing,
      status: 'Active',
      suspensionReason: null,
      suspendedBy: null,
      suspendedAt: null,
      reactivatedAt: now,
      updatedAt: now,
    };
    await db.upsert('sim_cards', updated);
    res.json({ success: true, data: updated, message: 'SIM card successfully reactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/sims/:id/reactivate', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getById('sim_cards', id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'SIM card not found' });
    }
    const now = new Date().toISOString();
    const updated = {
      ...existing,
      status: 'Active',
      suspensionReason: null,
      suspendedBy: null,
      suspendedAt: null,
      reactivatedAt: now,
      updatedAt: now,
    };
    await db.upsert('sim_cards', updated);
    res.json({ success: true, data: updated, message: 'SIM card successfully reactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/sims/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.delete('sim_cards', id);
    if (success) {
      res.json({ success: true, message: 'SIM card deleted' });
    } else {
      res.status(404).json({ success: false, error: 'SIM card could not be deleted' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== SIM RECHARGES CRUD ====================
app.get('/api/sim-recharges', async (req, res) => {
  try {
    const recharges = await db.getAll('sim_recharges');
    res.json({ success: true, data: recharges });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sim-recharges', async (req, res) => {
  try {
    const { recharge, updatedSim } = req.body.recharge ? req.body : { recharge: req.body, updatedSim: null };
    if (!recharge || (!recharge.simId && !recharge.contactNumber)) {
      return res.status(400).json({ success: false, error: 'Recharge payload with SIM identifier is required' });
    }

    if (!recharge.id) recharge.id = `REC-${Date.now()}`;
    const now = new Date().toISOString();

    // Auto calculate GST and Total
    const amount = Number(recharge.rechargeAmount) || 0;
    const gstPercent = Number(recharge.gstPercentage ?? 18);
    const gstAmount = Number(((amount * gstPercent) / 100).toFixed(2));
    const totalAmount = Number((amount + gstAmount).toFixed(2));

    const record = {
      ...recharge,
      rechargeAmount: amount,
      gstPercentage: gstPercent,
      gstAmount,
      totalAmount,
      createdAt: recharge.createdAt || now,
    };

    // Execute Cloud Database Transaction + Read-Back Verification Test
    const saved = await db.saveSimRechargeTransaction(record, updatedSim);
    console.log(`[Database] SIM recharge ₹${totalAmount} committed to Cloud DB (${db.activeEngine}) & verified by read-back: ${record.id}`);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error('[API SIM Recharge Post Error]:', err.message);
    res.status(500).json({
      success: false,
      error: `Recharge could not be completed because the production database is unavailable. (${err.message})`,
    });
  }
});

app.post('/api/sim-recharges/batch', async (req, res) => {
  try {
    const { recharges, updatedSims } = req.body;
    if (!Array.isArray(recharges) || recharges.length === 0) {
      return res.status(400).json({ success: false, error: 'Non-empty array of recharge records is required for batch recharge' });
    }

    const now = new Date().toISOString();
    const normalizedRecharges = recharges.map(r => {
      const amount = Number(r.rechargeAmount) || 0;
      const gstPercent = Number(r.gstPercentage ?? 18);
      const gstAmount = Number(((amount * gstPercent) / 100).toFixed(2));
      const totalAmount = Number((amount + gstAmount).toFixed(2));
      return {
        ...r,
        id: r.id || `REC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        rechargeAmount: amount,
        gstPercentage: gstPercent,
        gstAmount,
        totalAmount,
        createdAt: r.createdAt || now,
      };
    });

    const savedList = await db.saveBatchSimRechargeTransaction(normalizedRecharges, Array.isArray(updatedSims) ? updatedSims : []);
    console.log(`[Database] Batch SIM recharge committed to Cloud DB (${db.activeEngine}) for ${savedList.length} SIM lines with read-back verification.`);
    res.status(201).json({ success: true, data: savedList });
  } catch (err) {
    console.error('[API Batch SIM Recharge Post Error]:', err.message);
    res.status(500).json({
      success: false,
      error: `Batch recharge could not be completed because the production database is unavailable. (${err.message})`,
    });
  }
});

app.delete('/api/sim-recharges/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.delete('sim_recharges', id);
    if (success) {
      res.json({ success: true, message: 'Recharge entry deleted' });
    } else {
      res.status(404).json({ success: false, error: 'Recharge entry could not be deleted' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== SIM REQUESTS CRUD ====================
app.get('/api/sim-requests', async (req, res) => {
  try {
    const requests = await db.getAll('sim_requests');
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sim-requests', async (req, res) => {
  try {
    const request = req.body;
    if (!request.id) request.id = `SIMREQ-${Date.now()}`;
    const now = new Date().toISOString();
    const record = {
      ...request,
      status: request.status || 'Pending',
      createdAt: request.createdAt || now,
      updatedAt: now,
    };
    const saved = await db.upsert('sim_requests', record);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/sim-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getById('sim_requests', id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'SIM request not found' });
    }
    const updated = {
      ...existing,
      ...req.body,
      id,
      updatedAt: new Date().toISOString(),
    };
    await db.upsert('sim_requests', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/sim-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.delete('sim_requests', id);
    if (success) {
      res.json({ success: true, message: 'SIM request deleted' });
    } else {
      res.status(404).json({ success: false, error: 'SIM request could not be deleted' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// ==================== SERVICE PROVIDERS (PC/LAPTOP SUPPORT & VENDORS) CRUD ====================
app.get('/api/service-providers', async (req, res) => {
  try {
    const providers = await db.getAll('service_providers');
    res.json({ success: true, data: providers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/service-providers/:id', async (req, res) => {
  try {
    const provider = await db.getById('service_providers', req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, error: 'Service provider not found' });
    }
    res.json({ success: true, data: provider });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/service-providers', async (req, res) => {
  try {
    const provider = req.body;
    if (!provider || !provider.technicianName || !provider.shopName || !provider.phoneNumber) {
      return res.status(400).json({ success: false, error: 'Technician name, shop name, and phone number are required' });
    }
    if (!provider.id) provider.id = `PROV-${Date.now()}`;
    const now = new Date().toISOString();
    const saved = await db.upsert('service_providers', {
      ...provider,
      createdAt: provider.createdAt || now,
      updatedAt: now,
    });
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/service-providers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getById('service_providers', id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Service provider not found' });
    }
    const updated = {
      ...existing,
      ...req.body,
      id,
      updatedAt: new Date().toISOString(),
    };
    await db.upsert('service_providers', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/service-providers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.delete('service_providers', id);
    if (success) {
      res.json({ success: true, message: 'Service provider deleted' });
    } else {
      res.status(404).json({ success: false, error: 'Service provider could not be deleted' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== ASSET QUERIES (STAFF SUPPORT / FAULT TRACKING) CRUD ====================
app.get('/api/asset-queries', async (req, res) => {
  try {
    const queries = await db.getAll('asset_queries');
    res.json({ success: true, data: queries });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/asset-queries/:id', async (req, res) => {
  try {
    const query = await db.getById('asset_queries', req.params.id);
    if (!query) {
      return res.status(404).json({ success: false, error: 'Asset query not found' });
    }
    res.json({ success: true, data: query });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/asset-queries', async (req, res) => {
  try {
    const query = req.body;
    if (!query || !query.employeeId || !query.assetNumber) {
      return res.status(400).json({ success: false, error: 'Employee ID and Asset Number are required' });
    }
    if (!query.id) query.id = `QRY-${Date.now()}`;
    const now = new Date().toISOString();
    const saved = await db.upsert('asset_queries', {
      ...query,
      status: query.status || 'Open',
      createdAt: query.createdAt || now,
      updatedAt: now,
      history: query.history || [],
    });
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/asset-queries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getById('asset_queries', id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Asset query not found' });
    }
    const updated = {
      ...existing,
      ...req.body,
      id,
      updatedAt: new Date().toISOString(),
    };
    await db.upsert('asset_queries', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/asset-queries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.delete('asset_queries', id);
    if (success) {
      res.json({ success: true, message: 'Asset query deleted' });
    } else {
      res.status(404).json({ success: false, error: 'Asset query could not be deleted' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== REMOVED EMPLOYEES CRUD ====================
app.get('/api/removed-employees', async (req, res) => {
  try {
    const removed = await db.getAll('removed_employees');
    res.json({ success: true, data: removed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/removed-employees', async (req, res) => {
  try {
    const record = req.body;
    if (!record || !record.id) {
      return res.status(400).json({ success: false, error: 'Record ID is required for removed employee entry' });
    }
    const saved = await db.upsert('removed_employees', record);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/removed-employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.delete('removed_employees', id);
    if (success) {
      res.json({ success: true, message: 'Removed employee record deleted' });
    } else {
      res.status(404).json({ success: false, error: 'Record could not be deleted' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== BATCH SYNC FROM CLIENT INDEXEDDB ====================
app.post('/api/sync', async (req, res) => {
  try {
    const {
      employees,
      computers,
      assets,
      serviceRecords,
      allocationRecords,
      auditLogs,
      weeklyPhotoRecords,
      purchases,
      assetRequests,
      simCards,
      simRecharges,
      simRequests,
      serviceProviders,
      assetQueries,
      removedEmployees,
    } = req.body;

    if (Array.isArray(employees)) {
      for (const e of employees) await db.upsert('employees', e);
    }
    if (Array.isArray(computers)) {
      for (const c of computers) await db.upsert('computers', c);
    }
    if (Array.isArray(assets)) {
      for (const a of assets) await db.upsert('assets', a);
    }
    if (Array.isArray(serviceRecords)) {
      for (const s of serviceRecords) await db.upsert('service_records', s);
    }
    if (Array.isArray(allocationRecords)) {
      for (const al of allocationRecords) await db.upsert('allocations', al);
    }
    if (Array.isArray(auditLogs)) {
      for (const l of auditLogs) await db.upsert('audit_logs', l);
    }
    if (Array.isArray(weeklyPhotoRecords)) {
      for (const p of weeklyPhotoRecords) await db.upsert('weekly_photos', p);
    }
    if (Array.isArray(purchases)) {
      for (const pr of purchases) await db.upsert('purchases', pr);
    }
    if (Array.isArray(assetRequests)) {
      for (const ar of assetRequests) await db.upsert('asset_requests', ar);
    }
    if (Array.isArray(simCards)) {
      for (const s of simCards) await db.upsert('sim_cards', s);
    }
    if (Array.isArray(simRecharges)) {
      for (const r of simRecharges) await db.upsert('sim_recharges', r);
    }
    if (Array.isArray(simRequests)) {
      for (const sr of simRequests) await db.upsert('sim_requests', sr);
    }
    if (Array.isArray(serviceProviders)) {
      for (const sp of serviceProviders) await db.upsert('service_providers', sp);
    }
    if (Array.isArray(assetQueries)) {
      for (const aq of assetQueries) await db.upsert('asset_queries', aq);
    }
    if (Array.isArray(removedEmployees)) {
      for (const rem of removedEmployees) await db.upsert('removed_employees', rem);
    }

    const stats = await db.getStats();
    res.json({ success: true, message: 'Database synchronized', stats });
  } catch (err) {
    console.error('[API Sync Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== COMPLETE DATABASE CLEAR (ADMIN PURGE) ====================
app.post('/api/clear', async (req, res) => {
  try {
    const collections = [
      'employees',
      'computers',
      'assets',
      'service_records',
      'allocations',
      'audit_logs',
      'weekly_photos',
      'purchases',
      'asset_requests',
      'sim_cards',
      'sim_recharges',
      'sim_requests',
      'service_providers',
      'asset_queries',
      'removed_employees',
    ];
    for (const c of collections) {
      await db.clear(c);
    }
    console.log('[Database] Admin cleared all database tables permanently.');
    const stats = await db.getStats();
    res.json({ success: true, message: 'All database tables cleared', stats });
  } catch (err) {
    console.error('[API Clear Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== HOSTING & PRODUCTION STATIC ASSETS ====================
// When deployed on Render / Railway / VPS or production, serve the built Vite app
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  console.log(`[Static Serving] Serving production frontend from: ${distPath}`);
  app.use(express.static(distPath));

  // SPA fallback for React Router / hash routing
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Start Server (when run directly)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('====================================================');
    console.log(`🚀 AssetCore Backend Server running on port ${PORT}`);
    console.log(`📂 Database engine: ${db.activeEngine}`);
    console.log(`📁 Database path: ${db.dbPath}`);
    console.log(`🌐 API Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🔍 Database Diagnostic: http://localhost:${PORT}/api/db-status`);
    console.log('====================================================');
  });
}

export default app;



