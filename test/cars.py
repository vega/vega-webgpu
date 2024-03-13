import random
import json
import argparse
import os

def generate_random_data(num_records):
    data = []

    for _ in range(num_records):
        record = {
            "Name": random.choice(["mazda glc custom", "plymouth horizon miser", "mercury lynx l", "nissan stanza xe", "honda Accelerationord", "toyota corolla", "honda civic", "honda civic (auto)", "datsun 310 gx", "buick century limited", "oldsmobile cutlass ciera (diesel)", "chrysler lebaron medallion", "ford granada l", "toyota celica gt", "dodge charger 2.2", "chevrolet camaro", "ford mustang gl"]),
            "Cylinders": random.randint(4, 6),
            "Displacement": random.randint(91, 262),
            "Horsepower": random.randint(63, 112),
        }
        data.append(record)

    return data

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Generate random car data and save to JSON file')
    parser.add_argument('num_records', type=int, help='Number of records to generate')
    args = parser.parse_args()

    generated_data = generate_random_data(args.num_records)
    current_directory = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_directory, "data/cars_N_" + str(args.num_records) + ".json")
    with open(file_path, "w") as json_file:
        json.dump(generated_data, json_file, indent=2)
