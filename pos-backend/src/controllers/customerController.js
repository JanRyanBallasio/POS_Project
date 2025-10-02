const { supabase } = require("../config/db");

const customerController = {
    getAllCustomers: async (req, res) => {
        try {
            const { data, error } = await supabase
                .from("Customer")
                .select("*"); // Add semicolon here

            if (error) throw error;

            res.json({
                success: true,
                data: data,
                count: data.length,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    },
    
    createCustomer: async (req, res) => {
        try {
            const { name, points } = req.body;
            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: "Name is required"
                });
            }
            const { data, error } = await supabase
                .from("Customer")
                .insert([{ name, points: points || 0 }])
                .select()
                .single();

            if (error) throw error;

            res.json({
                success: true,
                data
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    },

    // NEW: Update customer points
    updateCustomerPoints: async (req, res) => {
        try {
            const { id } = req.params;
            const { points } = req.body;

            if (typeof points !== 'number') {
                return res.status(400).json({
                    success: false,
                    message: "Points must be a number"
                });
            }

            const { data, error } = await supabase
                .from("Customer")
                .update({ points })
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            
            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: "Customer not found"
                });
            }

            res.json({
                success: true,
                data
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    },

    // NEW: Add points to customer (for rewards/transactions)
    addPointsToCustomer: async (req, res) => {
        try {
            const { id } = req.params;
            const { pointsToAdd } = req.body;

            if (typeof pointsToAdd !== 'number' || pointsToAdd <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Points to add must be a positive number"
                });
            }

            // Get current points
            const { data: currentCustomer, error: fetchError } = await supabase
                .from("Customer")
                .select("points")
                .eq("id", id)
                .single();

            if (fetchError) throw fetchError;

            if (!currentCustomer) {
                return res.status(404).json({
                    success: false,
                    message: "Customer not found"
                });
            }

            const currentPoints = Number(currentCustomer.points) || 0;
            const newPoints = currentPoints + pointsToAdd;

            // Update points
            const { data, error } = await supabase
                .from("Customer")
                .update({ points: newPoints })
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;

            res.json({
                success: true,
                data,
                pointsAdded: pointsToAdd,
                previousPoints: currentPoints,
                newPoints: newPoints
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }
};

module.exports = customerController;