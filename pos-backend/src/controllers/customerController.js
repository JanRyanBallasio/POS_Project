const { supabase } = require("../config/db");

const customerController = {
    getAllCustomers: async (req, res) => {
        try {
            const { data, error } = await supabase
                .from("Customer")
                .select("*")

            if (error) throw error;

            res.json({
                success: true,
                data: data,
                count: data.length,
            })
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            })
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
    }
};

module.exports = customerController;